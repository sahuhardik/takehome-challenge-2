import { NotificationMacro, NotificationType } from '@common/enums';
import { AttachmentDo } from '@common/model';
import { Inject, Injectable } from '@nestjs/common';
import { EmailNotificationMetadataAttachment } from '@server/common';
import { NotificationBuyerKeys, NotificationChannel, NotificationMacroKeys, RoleType } from '@server/enums';
import ActivityEntity, {
  JobNotificationActivity,
  JobNotificationMessageActivity,
  NotificationActivityMessage,
  NotificationActivityMetadata,
  OrderNotificationActivity,
  OrderNotificationMessageActivity,
} from '@server/model/ActivityEntity';
import {
  MemberEmailNotification,
  MemberSlackNotification,
  MemberSmsNotification,
} from '@server/model/member-notification.entity';
import MemberEntity, { NotificationWindow } from '@server/model/member.entity';
import Notification, {
  EmailNotification,
  NotificationStatus,
  NotificationsTypes,
  SlackNotification,
  SmsNotification,
} from '@server/model/notification.entity';
import Performable, {
  PerformableEmailNotification,
  PerformableSlackNotification,
  PerformableSmsNotification,
} from '@server/model/performable.entity';
import UserNotification from '@server/model/user-notification.entity';
import UserToken from '@server/model/user-token.entity';
import UserEntity from '@server/model/user.entity';
import AwsService from '@server/services/AwsService';
import InvoiceService from '@server/services/InvoiceService';
import NotificationContextBuilder from '@server/services/notification/NotificationContextBuilder';
import { NotificationHelper } from '@server/services/notification/NotificationHelper';
import SendgridService, { SendMailAttachment } from '@server/services/SendgridService';
import SlackService from '@server/services/SlackService';
import TwilioService, { TwilioSendStatus } from '@server/services/TwilioService';
import UrlService from '@server/services/UrlService';
import moment from 'moment';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ConfigService } from 'nestjs-config';
import { EntityManager } from 'typeorm';
import { Not } from 'typeorm/index';
import { v4 } from 'uuid';
import { Logger } from 'winston';
import RuleService from '../RuleService';

export type NotificationContextMacros = { [K in NotificationMacro]?: string };

export interface NotificationQueueInput<A extends ActivityEntity<NotificationActivityMetadata>> {
  manager: EntityManager;
  type: NotificationType;
  from: MemberEntity;
  context: NotificationContext;
  to?: MemberEntity;
  cc?: UserEntity[];
  unique: string;
  scheduled?: Date;
  activity?: { type: new (metadata: A['metadata']) => A; metadata: Omit<A['metadata'], 'type' | 'messages'> };
}

export interface NotificationContext extends NotificationContextMacros {
  channel?: string;
  subject?: string;
  message?: string;
  notificationChannels?: NotificationChannel[];
  attachments?: AttachmentDo[];
  performable?: Performable;
}

@Injectable()
export default class NotificationService {
  public reap = false;
  private reaping = false;
  private log: Logger;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private config: ConfigService,
    private twilio: TwilioService,
    private sendgrid: SendgridService,
    private invoice: InvoiceService,
    private slack: SlackService,
    private helper: NotificationHelper,
    private aws: AwsService,
    private urlService: UrlService,
    private ruleService: RuleService
  ) {
    this.log = logger.child({ service: NotificationService.name });
  }

  builder(aggregate = false) {
    return new NotificationContextBuilder(this.urlService, this.invoice, this.aws, this.ruleService, aggregate);
  }

  getScheduledTimestampForSendingVendorSMSNotification(
    vendor: MemberEntity,
    toType: RoleType.BUYER | RoleType.PROVIDER,
    now?: number
  ): Date {
    const window: NotificationWindow =
      toType === RoleType.BUYER
        ? vendor.preferences.buyerNotificationWindow
        : vendor.preferences.providerNotificationWindow;
    const currentWindow = this.helper.getNotificationWindowForDate(
      moment.tz(now || Date.now(), vendor.timezone).toDate(),
      window,
      vendor.timezone
    );
    return this.helper.getScheduledTimestampFromNotificationWindow(
      moment.tz(now || Date.now(), vendor.timezone).toDate(),
      currentWindow.start,
      currentWindow.stop
    );
  }

  async queueNotification<A extends ActivityEntity<NotificationActivityMetadata>>(
    queueInput: NotificationQueueInput<A>
  ): Promise<Notification<any>[]> {
    const realTo = queueInput.to || queueInput.from;

    let toUsers = await Promise.all((await realTo.users).map((mu) => mu.user));

    if (queueInput.cc) {
      toUsers = [...toUsers, ...queueInput.cc];
    }

    const notifications = await queueInput.from.notifications;

    let performableNotifications = [];

    if (queueInput.context.performable) {
      performableNotifications = await queueInput.context.performable.notifications;
    }

    if (NotificationBuyerKeys.includes(queueInput.type)) {
      const override = await queueInput.from.buyerNotificationOverride;

      if (override) {
        toUsers = [override];
      }
    }

    const created: NotificationsTypes[] = [];
    const activities: NotificationActivityMessage[] = [];

    const createActivity = (notification: Notification<any>, user?: UserEntity) => {
      activities.push({
        id: notification.id,
        channel: notification.channel,
        text: notification.text.replace(/token=[A-z0-9-]+/g, ''),
        userId: user?.id,
        userName: user
          ? user.name || (notification.channel === NotificationChannel.EMAIL ? user.email : user.phone)
          : null,
      });
    };

    for (const user of toUsers) {
      const memberSMS = notifications.find((t) => t.type === queueInput.type && t instanceof MemberSmsNotification);
      const perfSMS = performableNotifications.find(
        (t) => t.type === queueInput.type && t instanceof PerformableSmsNotification
      );
      const messageText = queueInput.context.message || perfSMS?.message || memberSMS?.message;

      if (
        (queueInput.context.notificationChannels?.some((x) => x === NotificationChannel.SMS) ||
          perfSMS ||
          memberSMS?.global) &&
        messageText &&
        user.phone
      ) {
        const message = await this.replaceMacros(queueInput.manager, messageText, queueInput.context, user);

        if (queueInput.from !== realTo) {
          const notification = new SmsNotification();
          notification.type = queueInput.type;
          notification.fromId = queueInput.from.id;
          notification.status = NotificationStatus.UNSENT;
          notification.text = message;
          notification.toId = user.id;
          notification.unique = queueInput.unique;
          notification.scheduled = queueInput.scheduled;

          const exists = await queueInput.manager.count(SmsNotification, {
            where: {
              toId: user.id,
              type: queueInput.type,
              unique: notification.unique,
            },
          });

          if (exists) {
            continue;
          }

          await queueInput.manager.save(notification);

          createActivity(notification, user);

          created.push(notification);
        }
      }

      const memberEmail = notifications.find((t) => t.type === queueInput.type && t instanceof MemberEmailNotification);
      const perfEmail = performableNotifications.find(
        (t) => t.type === queueInput.type && t instanceof PerformableEmailNotification
      );
      const emailMessage = queueInput.context.message || perfEmail?.message || memberEmail?.message;
      const emailSubject = queueInput.context.subject || perfEmail?.metadata?.subject || memberEmail?.metadata?.subject;

      const perfAttachments = perfEmail?.metadata.attachments || [];

      const attachments: EmailNotificationMetadataAttachment[] = perfAttachments.length
        ? perfAttachments
        : memberEmail?.metadata.attachments || [];

      if (
        (queueInput.context.notificationChannels?.some((x) => x === NotificationChannel.EMAIL) ||
          perfEmail ||
          memberEmail?.global) &&
        emailMessage &&
        emailSubject
      ) {
        if (queueInput.from !== realTo) {
          const replaced = await this.replaceMacros(queueInput.manager, emailMessage, queueInput.context, user);
          const replacedSubject = await this.replaceMacros(queueInput.manager, emailSubject, queueInput.context, user);

          const notification = new EmailNotification();
          notification.type = queueInput.type;
          notification.fromId = queueInput.from.id;
          notification.status = NotificationStatus.UNSENT;
          notification.text = replaced;
          notification.toId = user.id;
          notification.unique = queueInput.unique || `${Date.now()}`;
          notification.unique = queueInput.unique || `${Date.now()}`;

          // TODO: make from adjustable per notification type
          notification.metadata = {
            subject: replacedSubject,
            attachments: [...attachments, ...(queueInput.context.attachments || [])],
            from: queueInput.from.fromEmail,
          };

          const exists = await queueInput.manager.count(EmailNotification, {
            where: {
              toId: user.id,
              type: queueInput.type,
              unique: notification.unique,
            },
          });

          if (exists) {
            continue;
          }

          await queueInput.manager.save(notification);

          createActivity(notification, user);

          created.push(notification);
        }
      }
    }

    const memberSlack = notifications.find((t) => t.type === queueInput.type && t instanceof MemberSlackNotification);
    const perfSlack = performableNotifications.find(
      (t) => t.type === queueInput.type && t instanceof PerformableSlackNotification
    );
    const slackMessage = queueInput.context.message || perfSlack?.message || memberSlack?.message;
    const slackChannel = queueInput.context.channel || memberSlack?.metadata?.channel;

    if (
      (queueInput.context.notificationChannels?.some((x) => x === NotificationChannel.SLACK) ||
        perfSlack ||
        memberSlack?.global) &&
      slackMessage &&
      slackChannel &&
      queueInput.from.slackTeamId
    ) {
      const replaced = await this.replaceMacros(queueInput.manager, slackMessage, queueInput.context);

      const notification = new SlackNotification();
      notification.type = queueInput.type;
      notification.fromId = queueInput.from.id;
      notification.status = NotificationStatus.UNSENT;
      notification.text = replaced;
      notification.unique = queueInput.unique || `${Date.now()}`;
      notification.metadata = { channel: slackChannel };

      const exists = await queueInput.manager.count(SlackNotification, {
        where: {
          type: queueInput.type,
          unique: notification.unique,
        },
      });

      if (!exists) {
        await queueInput.manager.save(notification);

        created.push(notification);

        createActivity(notification);
      }
    }

    // causes sendNotification() to get reap'd by ReaperInterceptor after sending request to user
    this.reap = true;

    if (queueInput.activity.type && activities.length > 0) {
      const activity = new queueInput.activity.type({
        orderId: null,
        address: null,
        memberId: null,
        jobId: null,
        ...queueInput.activity.metadata,
        type: queueInput.type,
        messages: activities,
      });

      await queueInput.manager.save(activity);
    }

    return created;
  }

  private async replaceMacros(em: EntityManager, message: string, context: NotificationContext, user?: UserEntity) {
    let replaced = message;

    for (const macro of NotificationMacroKeys) {
      let value = context[macro];

      if (!value && user) {
        if ([NotificationMacro.USER_FIRST, NotificationMacro.RECIPIENT_FIRST].includes(macro as NotificationMacro)) {
          value = user.first;
        }

        if ([NotificationMacro.RECIPIENT_LAST].includes(macro as NotificationMacro)) {
          value = user.last;
        }
      }

      const links = [NotificationMacro.JOB_LINK, NotificationMacro.ORDER_LINK, NotificationMacro.DELIVERABLE_LINK];

      if (user && links.includes(macro as NotificationMacro) && value) {
        const token = new UserToken();
        token.userId = user.id;
        token.token = v4();

        await em.save(token);

        // TODO: use proper url parser incase of existing query params
        value += `?token=${token.token}`;
      }

      replaced = replaced.replace(new RegExp(`{{${macro}}}`, 'gi'), value);
    }

    return replaced;
  }

  private async findReadyNotifications(em: EntityManager, now?: number): Promise<Notification<any>[]> {
    return em.find(Notification, {
      where: `status IN ('${NotificationStatus.UNSENT}')
      AND (scheduled IS NULL OR extract(epoch from scheduled) <= ${now || Date.now()} / 1000 + 1)`, // pg epoch = seconds js epoch = milliseconds
    });
  }

  public async updateActivityStatus(
    em: EntityManager,
    notificationId: string,
    status: NotificationStatus,
    date: Date = new Date()
  ): Promise<void> {
    const activity = await em
      .createQueryBuilder()
      .select('a')
      .from(ActivityEntity, 'a')
      .where(`a.date > :date and a.metadata->'messages' @> '[{"id":"${notificationId}"}]'`, {
        date: moment().subtract(7, 'days').toDate(),
      })
      .getOne();

    if (!activity) {
      return;
    }

    if (activity instanceof JobNotificationActivity) {
      const { messages, type, ...metadata } = activity.metadata;

      const message = new JobNotificationMessageActivity({
        status,
        ...metadata,
        message: messages.find((m) => m.id === notificationId),
      });
      message.parentId = activity.id;
      message.date = date;

      await em.save(message);

      return;
    }

    if (activity instanceof OrderNotificationActivity) {
      const { messages, type, ...metadata } = activity.metadata;

      const message = new OrderNotificationMessageActivity({
        status,
        ...metadata,
        message: messages.find((m) => m.id === notificationId),
      });
      message.parentId = activity.id;
      message.date = date;

      await em.save(message);

      return;
    }

    throw new Error(`Not a notification activity: ${notificationId}`);
  }

  public async reaper(em: EntityManager) {
    if (this.reaping || !this.config.get('common.reaper')) {
      return;
    }

    this.reaping = true;

    try {
      const notifications = await this.findReadyNotifications(em);

      for (const notification of notifications) {
        await this.sendNotification(em, notification);
      }

      const pending = await em.find(Notification, {
        // email is handled by webhook
        where: { status: NotificationStatus.PENDING, channel: Not(NotificationChannel.EMAIL) },
        order: { created: 'ASC' },
      });

      for (const notification of pending) {
        const log = this.log.child({ notificationId: notification.id, type: notification.type });

        try {
          await em.transaction(async (tx) => {
            log.info('Checking status of notification');

            if (notification instanceof SmsNotification) {
              const state = await this.twilio.messageState(notification.externalId);

              let status: NotificationStatus;

              switch (state.status) {
                case TwilioSendStatus.BLACKLISTED:
                  status = NotificationStatus.SKIPPED;
                  break;
                case TwilioSendStatus.DELIVERED:
                  status = NotificationStatus.SENT;
                  break;
                case TwilioSendStatus.FAILED:
                  status = NotificationStatus.ERROR;
                  break;
                case TwilioSendStatus.QUEUED:
                  if (
                    notification.lastAttempted &&
                    moment().subtract({ hours: 1 }).isAfter(notification.lastAttempted)
                  ) {
                    // if status is still in sent after an hour, carrier did not confirm delivery
                    status = NotificationStatus.SENT;
                  }
                  break;
                case TwilioSendStatus.RETRY:
                  if (
                    !notification.lastAttempted ||
                    moment().subtract({ minutes: 10 }).isAfter(notification.lastAttempted)
                  ) {
                    await this.sendNotification(tx, notification);
                  }

                  return;
              }

              if (status) {
                notification.confirmed = new Date();
                notification.status = status;

                log.info('Updating status of notification', { status });

                await tx.save(notification);

                await this.updateActivityStatus(tx, notification.id, status, state.date);
              } else {
                log.info('Ignoring status of notification', { status });
              }
            }
          });
        } catch (ex) {
          log.error(ex);
        }
      }
    } finally {
      this.reaping = false;
    }
  }

  public async sendNotification(em: EntityManager, notification: Notification<any>) {
    this.log.info('Sending notification', { notificationId: notification.id });

    if (notification instanceof SmsNotification) {
      await this.doSend(em, notification, async (user) => {
        const resp = await this.twilio.sendMessage(user, notification.text);

        if (!resp || resp.status === TwilioSendStatus.BLACKLISTED) {
          return NotificationStatus.SKIPPED;
        }

        notification.externalId = resp.sid;

        if (notification.attempts > 3) {
          return NotificationStatus.ERROR;
        }

        if (!resp.sid) {
          return NotificationStatus.UNSENT;
        }

        return NotificationStatus.PENDING;
      });
    } else if (notification instanceof EmailNotification) {
      await this.doSend(em, notification, async (user) => {
        const attachments: SendMailAttachment[] = await Promise.all(
          (notification.metadata.attachments || []).map(async (attachment) => {
            const file = await this.aws.getFile(attachment.url);

            return {
              base64Content: file.content.toString('base64'),
              filename: attachment.name,
              mime: attachment.mime,
            };
          })
        );

        await this.sendgrid.sendText({
          email: user.email,
          subject: notification.metadata.subject,
          text: notification.text,
          metadata: {
            notificationId: notification.id,
          },
          from: notification.metadata.from,
          attachments,
        });

        return NotificationStatus.PENDING;
      });
    } else if (notification instanceof SlackNotification) {
      await this.doSend(em, notification, async () => {
        const member = await notification.from;

        if (!member.slackTeamId) {
          throw new Error('missing slack team id.');
        }

        await this.slack.postMessage(member.slackTeamId, notification.metadata.channel, notification.text);
      });
    } else {
      notification.status = NotificationStatus.INVALID;

      await em.save(notification);
    }
  }

  private async doSend(
    em: EntityManager,
    notification: Notification<any>,
    send: (user?: UserEntity) => Promise<NotificationStatus | void>
  ) {
    const user = await notification.to;

    if (user) {
      if (!user.notify[notification.channel]) {
        notification.status = NotificationStatus.SKIPPED;

        await em.save(notification);

        return;
      }

      const un = await em.findOne(UserNotification, {
        where: {
          userId: user.id,
          exclude: true,
          channel: notification.channel,
          type: notification.type,
        },
      });

      if (un) {
        // user has silenced this specific notification
        notification.status = NotificationStatus.SKIPPED;

        await em.save(notification);

        return;
      }
    }

    notification.lastAttempted = new Date();
    notification.attempts += 1;

    try {
      const status = await send(user);

      notification.status = status || NotificationStatus.SENT;

      this.log.info('Queued notification', { notificationId: notification.id });
    } catch (ex) {
      this.log.error(`Failed to send notification: ${notification.id}`, ex);
    }

    if (notification.status === NotificationStatus.SENT) {
      notification.confirmed = new Date();
    }

    await em.save(notification);
  }
}
