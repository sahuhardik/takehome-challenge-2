import { FieldType } from '@common/enums';
import { ConditionType, RuleContextAccessor } from '@common/rules/Condition';
import { buildConditionTree, validateConditionTree } from '@common/rules/Rule';
import RuleContext, { RuleContextField, RuleContextPerformable } from '@common/rules/RuleContext';
import { Injectable } from '@nestjs/common';
import { WriteDiscriminatorFind } from '@server/decorators/WriteDiscriminator';
import Deliverable from '@server/model/deliverable.entity';
import Job from '@server/model/job.entity';
import CustomFieldEntity from '@server/model/member-field.entity';
import { VendorBuyerRelationshipEntity } from '@server/model/member-relationship.entity';
import Order from '@server/model/order.entity';
import ActionEntity from '@server/model/rules/ActionEntities';
import { ConditionEntity } from '@server/model/rules/ConditionEntities';
import RuleEntity from '@server/model/rules/RuleEntities';
import { ConditionWrite } from '@server/model/rules/RuleWrite';
import { FieldService } from '@server/services/FieldService';
import HolidayService from '@server/services/HolidayService';
import dayjs from 'dayjs';
import moment from 'moment';
import { EntityManager, LessThanOrEqual, Raw } from 'typeorm';

@Injectable()
export default class RuleService {
  constructor(private fieldService: FieldService, private holidayService: HolidayService) {}

  async persistConditions(em: EntityManager, conditions: ConditionWrite[]) {
    const entities: ConditionEntity<ConditionType, any>[] = [];

    for (const { id, group, logic, ...discriminator } of conditions) {
      let entity = await em.findOne(ConditionEntity, id);

      if (!entity) {
        entity = ConditionEntity.fromType(discriminator.type);
        entity.id = id;
      }

      entity.group = group;
      entity.logic = logic;

      const metadata = WriteDiscriminatorFind(discriminator);

      const flattenMetadata = (metadata: any) => {
        if (metadata['dynamic']) {
          const dynamic = WriteDiscriminatorFind(metadata['dynamic']) as any;

          metadata['dynamic'] = {
            type: metadata?.dynamic['type'],
            ...dynamic,
          };
        }

        return metadata;
      };

      if (metadata['field']) {
        flattenMetadata(metadata['field']);
      } else {
        flattenMetadata(metadata);
      }

      entity.metadata = metadata;

      await em.save(entity);

      entities.push(entity);
    }

    return entities;
  }

  async evaluateRules(
    em: EntityManager,
    memberId: string,
    context: RuleContext,
    date = new Date()
  ): Promise<ActionEntity<any, any>[]> {
    // should pass in date to prevent new rules from adjusting old orders
    const rules = await em.find(RuleEntity, {
      where: {
        memberId,
        created: LessThanOrEqual(date),
        archived: Raw((alias) => `(${alias} is null OR ${alias} >= :date)`, { date }),
      },
    });

    const valid: ActionEntity<any, any>[][] = [];

    await Promise.all(
      rules.map(async (rule) => {
        const conditions = await rule.conditions;
        const tree = buildConditionTree(conditions);

        if (validateConditionTree(new RuleContextAccessor(context), tree)) {
          valid.push(await rule.actions);
        }
      })
    );

    return valid.flat();
  }

  public async buildJobContext(em: EntityManager, jobId: string, orderContext?: RuleContext): Promise<RuleContext> {
    const job = await em.findOne(Job, jobId);

    const context = orderContext || (await this.buildOrderContext(em, job.orderId));

    context.performable = await this.generatePerformableContext(job);

    if (job.currentAssigneeId) {
      context.providerMemberId = job.currentAssigneeId;
    }

    if (job.currentScheduled) {
      const [event, holidays, vendor] = await Promise.all([
        job.event,
        this.holidayService.getHolidaysForDate(job.currentScheduled),
        job.order.then((o) => o.vendor),
      ]);

      context.appointment = {
        // TODO: if appointments do not have an address?
        address: event?.address || context.order.address,
        timezone: vendor.timezone,
        holidays: holidays.map((h) => h.id),
        start: job.currentScheduled,
        end: moment(job.currentScheduled).add(job.onsite, 'minutes').toDate(),
      };
    }

    return context;
  }

  public async buildOrderContext(em: EntityManager, orderId: string): Promise<RuleContext> {
    const context: RuleContext = {};

    const orderP = em.findOne(Order, orderId);

    const [holidays, order, vendor, jobs, fields, requested] = await Promise.all([
      orderP.then((o) => this.holidayService.getHolidaysForYear(o.created)),
      orderP,
      orderP.then((o) => o.vendor),
      em.find(Job, { where: { orderId } }),
      orderP.then((o) => em.find(CustomFieldEntity, { where: { memberId: o.vendorId } })),
      orderP.then((o) => o.requested),
    ]);

    context.order = {
      date: order.created,
      source: order.source,
      timezone: vendor.timezone,
      requested: requested.map((r) => ({
        start: dayjs(r.start).toDate(),
        end: dayjs(r.end).toDate(),
        timezone: vendor.timezone,
        holidays: holidays.filter((h) => dayjs(h.date).isSame(r.start, 'day')).map((h) => h.id),
      })),
      holidays: holidays.filter((h) => dayjs(h.date).isSame(order.created, 'day')).map((h) => h.id),
      address: { postalCode: order.address?.postalCode },
      performables: await Promise.all(
        jobs.map(async (job) => {
          const properties = await job.fields;

          const fields = await Promise.all(
            properties.map(async (property) => {
              const field = await property.property;

              return {
                fieldId: field.id,
                type: field.fieldType,
                numberValue: property.numberValue,
                textValue: property.propertyValueId || property.stringValue,
                booleanValue: property.booleanValue,
              };
            })
          );

          return { performableId: job.serviceId || job.performableId, fields };
        })
      ),
      fields: await this.fieldService.jsonToFieldValues(order.metadata || {}, fields),
    };

    context.buyers = [];

    let buyer = await order.buyerRel;

    while (buyer != null) {
      const buyerFields = await buyer.fields;

      context.buyers.push({
        buyerId: buyer.id,
        fields: buyerFields.map((field) => ({
          fieldId: field.fieldId,
          type: fields.find((f) => f.id === field.fieldId).type,
          numberValue: field.numberValue,
          textValue: field.stringValue,
          booleanValue: field.booleanValue,
        })),
      });

      // TODO: optimize this with nested sets
      const parent = await buyer.buyer.then((b) => b.parent);

      if (parent) {
        buyer = await em.findOne(VendorBuyerRelationshipEntity, {
          where: {
            buyerId: parent.id,
            vendorId: buyer.vendorId,
          },
        });
      } else {
        buyer = null;
      }
    }

    return context;
  }

  public async generatePerformableContext(job: Job): Promise<RuleContextPerformable> {
    const [fields, deliverables]: [RuleContextField[], Deliverable<unknown>[]] = await Promise.all([
      job.fields.then((properties) =>
        Promise.all(
          properties.map(async (jobProperty) => {
            const property = await jobProperty.property;

            const field: RuleContextField = {
              fieldId: property.id,
              type: property.fieldType,
            };

            const value = await jobProperty.getValue();

            switch (property.fieldType) {
              case FieldType.SELECT:
                field.textValue = value;
                break;
              case FieldType.MULTI:
              case FieldType.SINGLE:
              case FieldType.DATE:
              case FieldType.ADDRESS:
                field.textValue = value;
                break;
              case FieldType.BOOLEAN:
                field.booleanValue = value;
                break;
              case FieldType.NUMBER:
                field.numberValue = value;
                break;
              case FieldType.REPEAT:
                field.repeatValue = (value || []).map((v) =>
                  Object.entries(v).map(([key, value]) => ({ name: key, value }))
                );
                break;
            }

            return field;
          })
        )
      ),
      job.deliverables,
    ]);

    return {
      performableId: job.performableId || job.serviceId,
      fields,
      deliverables: deliverables.map(() => ({ fields: [] })),
    };
  }
}
