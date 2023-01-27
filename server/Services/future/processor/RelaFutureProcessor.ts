import { Injectable } from '@nestjs/common';
import { RelaIntegrationsType } from '@server/enums';
import { VendorBuyerRelationshipEntity } from '@server/model/member-relationship.entity';
import MemberEntity from '@server/model/member.entity';
import { FutureType } from '@server/services/future/Future';
import FutureMetadata, { FutureDependency } from '@server/services/future/FutureMetadata';
import FutureProcessor from '@server/services/future/FutureProcessor';
import { RelaApi } from '@server/services/rela/RelaApi';
import { RelaContext } from '@server/services/rela/RelaContext';
import { EntityManager } from 'typeorm';
import { Logger } from 'winston';

@Injectable()
export class RelaFutureProcessor implements FutureProcessor<FutureType.INTEGRATION_RELA> {
  type = FutureType.INTEGRATION_RELA;

  constructor(private readonly api: RelaApi) {}

  async handle(
    log: Logger,
    em: EntityManager,
    metadata: FutureMetadata<FutureType.INTEGRATION_RELA>,
    dependencies: FutureDependency<FutureType.INTEGRATION_RELA>[]
  ): Promise<FutureMetadata<FutureType.INTEGRATION_RELA>> {
    const context = await RelaFutureProcessor.getContext(em, metadata.buyerRelId);
    let agentUserId: string;
    let siteId: string;
    const deliverableIds = [] as string[];

    dependencies.forEach((d) => {
      if (d.type === FutureType.CALLBACK_BUYER_USER_SYNCED) {
        agentUserId = d.metadata.externalUserId;
      } else if (d.type === FutureType.CALLBACK_SITE_ADDED) {
        siteId = d.metadata.externalSiteId;
      } else if (d.type === FutureType.CALLBACK_DELIVERABLE_ADDED) {
        deliverableIds.push(d.metadata.externalMediaId);
      }
    });

    switch (metadata.type) {
      case RelaIntegrationsType.ENSURE_USER_EXISTS:
        return {
          ...metadata,
          response: await this.api.ensureUserExists(context, metadata.payload),
        };
      case RelaIntegrationsType.CREATE_SITE: {
        const externalAgentUserId = metadata.payload?.externalAgentUserId || agentUserId;

        return {
          ...metadata,
          response: await this.api.createSite(context, {
            ...metadata.payload,
            externalAgentUserId,
          }),
        };
      }
      case RelaIntegrationsType.ADD_DELIVERABLE_TO_SITE: {
        const externalSiteId = metadata.payload?.externalSiteId || siteId;
        return {
          ...metadata,
          response: await this.api.addDeliverableToSite(context, {
            ...metadata.payload,
            externalSiteId,
          }),
        };
      }
      case RelaIntegrationsType.SORT_SITE_DELIVERABLES: {
        return metadata;
      }
      case RelaIntegrationsType.PUBLISH_SITE: {
        const externalSiteId = metadata.payload?.externalSiteId || siteId;
        await this.api.publishSite(context, {
          ...metadata.payload,
          externalSiteId,
        });
        return metadata;
      }
    }

    throw new Error(`RelaIntegrationsType not implemented.`);
  }

  private static async getContext(em: EntityManager, buyerRelId: string) {
    const buyerRel = await em.findOne(VendorBuyerRelationshipEntity, buyerRelId);
    const vendor = await em.findOne(MemberEntity, buyerRel.vendorId);
    return new RelaContext(buyerRel, vendor);
  }
}
