import { NotificationMacro, NotificationType, TimeZone } from '@common/enums';
import { AttachmentDo } from '@common/model';
import { NotificationChannel, PerformableLinkType, PerformableOutputType } from '@server/enums';
import Job from '@server/model/job.entity';
import { VendorBuyerRelationshipEntity } from '@server/model/member-relationship.entity';
import MemberEntity from '@server/model/member.entity';
import Order from '@server/model/order.entity';
import { ActionAttachFilesEntity } from '@server/model/rules/ActionEntities';
import UserEntity from '@server/model/user.entity';
import AwsService from '@server/services/AwsService';
import InvoiceService from '@server/services/InvoiceService';
import { NotificationContext } from '@server/services/notification/NotificationService';
import UrlService from '@server/services/UrlService';
import moment from 'moment-timezone';
import { EntityManager } from 'typeorm/index';
import RuleService from '../RuleService';

export default class NotificationContextBuilder {
  private context: NotificationContext = {};
  private queue: Promise<void>[] = [];

  constructor(
    private urlService: UrlService,
    private invoiceService: InvoiceService,
    private aws: AwsService,
    private ruleService: RuleService,
    private aggregate = false
  ) {}

  private setField(field: NotificationMacro, value: string, append = true) {
    if (this.context[field]) {
      if (this.context[field] === value) {
        return;
      }

      if (!this.aggregate) {
        throw new Error(`Attempting to set "${field}" multiple times on a non-aggregated notification.`);
      }

      if (!append) {
        throw new Error(`Attempting to set "${field}" multiple times with different values.`);
      }

      this.context[field] += `,${value}`;
    } else {
      this.context[field] = value;
    }
  }

  job(job: Job) {
    this.queue.push(
      new Promise((resolve, reject) => {
        job.order
          .then(async (order) => {
            const vendor = await order.vendor;
            const assignee = await job.assignee;

            this.order(order);

            if (!this.aggregate) {
              this.setField(NotificationMacro.JOB_ID, job.id);
            }

            if (job.scheduled && !this.context.date_short) {
              this.dateTime(assignee?.timezone || vendor?.timezone, job.scheduled);
            }

            const performable = await job.getPerformable();

            if (performable) {
              if (!this.aggregate) {
                // only used for notification preferences per service, shouldn't be needed in most aggregate cases
                this.context.performable = performable;
              }

              this.setField(NotificationMacro.SERVICE_NAME, performable.name);
              this.setField(NotificationMacro.SERVICE_SHORT, performable.name);
            }

            if (assignee) {
              this.setField(NotificationMacro.PROVIDER_COMPANY, assignee.company, false);

              // TODO: what if multiple?
              const users = await assignee.users;

              if (users[0]) {
                const user = await users[0].user;

                this.setField(NotificationMacro.PROVIDER_NAME, user.name, false);
              } else {
                this.setField(NotificationMacro.PROVIDER_NAME, '', false);
              }
            }

            resolve();
          })
          .catch(reject);
      })
    );

    return this;
  }

  initiator(user?: UserEntity) {
    if (user) {
      this.context.initiator_first = user.first;
      this.context.initiator_last = user.last;
    }

    return this;
  }

  user(user?: UserEntity) {
    this.initiator(user);

    if (user) {
      this.context.user_first = user.first;
    }

    return this;
  }

  eventLinkProvider(job: Job) {
    if (!job.onsite) {
      // offsite jobs do not have calendar events
      return this.jobLinkProvider(job);
    }

    this.queue.push(
      new Promise((resolve, reject) => {
        job.assignee
          .then((assignee) => {
            if (!assignee) {
              reject(`Job (${job.id}) does not have a provider assigned.`);

              return;
            }

            this.context.job_link = this.urlService.buildProviderUrl(job.assigneeId, `/schedule/${job.group}`);

            resolve();
          })
          .catch(reject);

        resolve();
      })
    );

    return this;
  }

  jobLinkProvider(job: Job) {
    this.queue.push(
      new Promise((resolve, reject) => {
        job.assignee
          .then((assignee) => {
            if (!assignee) {
              reject(`Job (${job.id}) does not have a provider assigned.`);

              return;
            }

            this.context.job_link = this.urlService.buildProviderUrl(job.assigneeId, `/job/${job.id}`);

            resolve();
          })
          .catch(reject);
      })
    );

    return this;
  }

  jobLinkBuyer(job: Job, rel: VendorBuyerRelationshipEntity) {
    this.queue.push(
      new Promise((resolve, reject) => {
        job
          .getPerformable()
          .then(async (performable) => {
            this.context.order_link = await this.urlService.buildBuyerUrl(rel, `/orders/${job.orderId}`);

            if (performable?.deliverLinkType === PerformableLinkType.OUTPUT) {
              if (performable.outputType === PerformableOutputType.HDPHOTOHUB) {
                const order = await job.order;
                const vendor = await order.vendor;

                this.context.job_link = `${vendor.preferences.hdPhotoHubUrl}/${job.hdPhotoHubId}`;
              }
            }

            if (!this.context.job_link) {
              this.context.job_link = await this.urlService.buildBuyerUrl(rel, `/orders/${job.orderId}/job/${job.id}`);
            }

            resolve();
          })
          .catch(reject);
      })
    );

    return this;
  }

  jobLinkVendor(job: Job) {
    this.queue.push(
      new Promise((resolve, reject) => {
        job.order
          .then((order) => {
            this.context.order_link = this.urlService.buildVendorUrl(order.vendorId, `/order/${job.orderId}`);
            this.context.job_link = this.urlService.buildVendorUrl(
              order.vendorId,
              `/order/${job.orderId}/job/${job.id}`
            );

            resolve();
          })
          .catch(reject);
      })
    );

    return this;
  }

  manualMessage(notificationChannels: NotificationChannel[], message: string, subject?: string, channel?: string) {
    this.context.notificationChannels = notificationChannels;
    this.context.message = message;
    if (subject) {
      this.context.subject = subject;
    }
    if (channel) {
      this.context.channel = channel;
    }
    return this;
  }

  buyer(buyer: MemberEntity) {
    this.context.buyer_company = buyer.company;
    return this;
  }

  range(timezone: TimeZone, start: Date, end: Date) {
    this.context.range_start = moment(start).tz(timezone).format('M/D h:mm A');
    this.context.range_end = moment(end).tz(timezone).format('M/D h:mm A');
    return this;
  }

  dateTime(timezone: TimeZone, value: Date | number | string = Date.now()) {
    const scheduled = moment(value).tz(timezone);
    const hour = scheduled.format('h');
    const minutes = scheduled.format('mm');
    const ampm = scheduled.format('A');

    if (minutes === '00') {
      this.setField(NotificationMacro.TIME_SHORT, `${hour}${ampm}`, false);
    } else {
      this.setField(NotificationMacro.TIME_SHORT, `${hour}:${minutes}${ampm}`, false);
    }

    this.setField(NotificationMacro.DATE_SHORT, scheduled.format('M/D'), false);

    return this;
  }

  order(order: Order) {
    this.context.order_id = `${order.id}`;

    if (order.address) {
      if (order.address.line1) {
        this.context.address_number = order.address.line1.split(' ')[0];
        this.context.address_street = order.address.line1.replace(`${this.context.address_number} `, '');
      }

      this.context.address_city = order.address.city;
      this.context.address_state = order.address.state;
    }

    return this;
  }

  orderInvoice(em: EntityManager, order: Order) {
    if (process.env.ENV === 'cli') {
      return;
    }

    this.queue.push(
      this.invoiceService.generateInvoice(em, order.id).then((pdf) => {
        const mime = 'application/pdf';
        const name = `order-${order.id}-invoice-${Date.now()}.pdf`;

        return this.aws.temporaryVendorUpload(order.vendorId, name, mime, pdf).then((url) => {
          this.context.attachments = [
            {
              name: name,
              url,
              mime,
            },
          ];
        });
      })
    );

    return this;
  }

  orderLinkVendor(order: Order) {
    this.context.order_link = this.urlService.buildVendorUrl(order.vendorId, `/order/view/${order.id}/jobs`);

    return this;
  }

  orderLinkBuyer(order: Order, rel: VendorBuyerRelationshipEntity) {
    this.queue.push(
      this.urlService.buildBuyerUrl(rel, `/orders/${order.id}`).then((url) => {
        this.context.order_link = url;
      })
    );

    return this;
  }

  clone() {
    const cloned = new NotificationContextBuilder(this.urlService, this.invoiceService, this.aws, this.ruleService);
    cloned.context = JSON.parse(JSON.stringify(this.context));

    return cloned;
  }

  addAttachments(attachments: AttachmentDo[]) {
    if (this.context.attachments) {
      this.context.attachments = this.context.attachments.concat(attachments);
    } else {
      this.context.attachments = attachments;
    }
    return this;
  }

  async addRuleAttachments(em: EntityManager, order: Order, notificationType: NotificationType) {
    const vendor = await order.vendor;
    const vendorId = vendor.id;
    const orderContext = await this.ruleService.buildOrderContext(em, order.id);
    const actions = await this.ruleService.evaluateRules(em, vendorId, orderContext, order.created);

    for (const action of actions) {
      if (action instanceof ActionAttachFilesEntity) {
        const { notificationType: actionNotificationType, attachments } = action.metadata;
        if (actionNotificationType === notificationType) {
          this.addAttachments(attachments);
        }
      }
    }
    return this;
  }

  async build(override: Partial<NotificationContext> = {}) {
    await Promise.all(this.queue);

    return { ...this.context, ...override };
  }
}
