import { NotificationType } from '@common/enums';
import { NotificationChannel } from '@server/enums';
import ActivityEntity, {
  JobNotificationActivity,
  JobNotificationMessageActivity,
  OrderNotificationActivity,
  OrderNotificationMessageActivity,
} from '@server/model/ActivityEntity';
import { NotificationStatus } from '@server/model/notification.entity';
import { ServiceModule } from '@server/services/module';
import NotificationService from '@server/services/notification/NotificationService';
import { nestDatabaseTest } from '@server/testing';

const describe = nestDatabaseTest({
  imports: [ServiceModule],
});

describe('NotificationService', () => {
  describe('updateActivityStatus', (it) => {
    it('should create new order message activity', async (manager, module) => {
      const service = module.get(NotificationService);

      const message = {
        id: '1234',
        channel: NotificationChannel.EMAIL,
        text: 'wee',
      };

      await manager.save(
        new OrderNotificationActivity({
          type: NotificationType.ORDER_CONFIRM,
          messages: [message],
          orderId: '1',
          memberId: '2',
          address: {} as any,
        })
      );

      await service.updateActivityStatus(manager, message.id, NotificationStatus.SENT);

      const activities = await manager.find(ActivityEntity);

      expect(activities).toHaveLength(2);

      const activity = activities.find((a) => a instanceof OrderNotificationMessageActivity);

      expect(activity?.metadata).toMatchObject({
        status: NotificationStatus.SENT,
        message,
      });
    });

    it('should ignore if no message matches', async (manager, module) => {
      const service = module.get(NotificationService);

      const message = {
        id: '1234',
        channel: NotificationChannel.EMAIL,
        text: 'wee',
      };

      await manager.save(
        new JobNotificationActivity({
          type: NotificationType.ORDER_CONFIRM,
          messages: [message],
          jobId: '1',
          memberId: '2',
          performable: '3',
        })
      );

      await service.updateActivityStatus(manager, '5678', NotificationStatus.SENT);

      const activities = await manager.find(ActivityEntity);

      expect(activities).toHaveLength(1);
    });

    it('should create new job message activity', async (manager, module) => {
      const service = module.get(NotificationService);

      const message = {
        id: '1234',
        channel: NotificationChannel.EMAIL,
        text: 'wee',
      };

      await manager.save(
        new JobNotificationActivity({
          type: NotificationType.ORDER_CONFIRM,
          messages: [message],
          jobId: '1',
          memberId: '2',
          performable: '3',
        })
      );

      await service.updateActivityStatus(manager, message.id, NotificationStatus.SENT);

      const activities = await manager.find(ActivityEntity);

      expect(activities).toHaveLength(2);

      const activity = activities.find((a) => a instanceof JobNotificationMessageActivity);

      expect(activity?.metadata).toMatchObject({
        status: NotificationStatus.SENT,
        message,
      });
    });
  });
});
