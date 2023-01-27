import { HdphotohubIntegrationsType, MicrositeStatus } from '@server/enums';
import Order from '@server/model/order.entity';
import { FutureType } from '@server/services/future/Future';
import { SitePublishedFutureProcessor } from '@server/services/future/processor/SitePublishedFutureProcessor';
import { ServiceModule } from '@server/services/module';
import { nestDatabaseTest } from '@server/testing';

const describe = nestDatabaseTest({
  imports: [ServiceModule],
});

describe('SitePublishedFutureProcessor', (it) => {
  describe('handle', () => {
    it('should update status', async (manager) => {
      const order = new Order();
      await manager.save(order);
      const processor = new SitePublishedFutureProcessor();

      await processor.handle(
        {} as any,
        manager,
        {
          internalOrderId: order.id,
        },
        [
          {
            type: FutureType.INTEGRATION_HD_PHOTO_HUB,
            metadata: {
              type: HdphotohubIntegrationsType.PUBLISH_SITE,
            },
          } as any,
        ]
      );
      const { micrositeStatus } = await manager.findOne(Order, order.id);

      expect(micrositeStatus).toBe(MicrositeStatus.PUBLISHED);
    });

    it('should fail if not correct dependency future type', async (manager) => {
      const processor = new SitePublishedFutureProcessor();

      const result = processor.handle({} as any, manager, {} as any, [
        {
          type: FutureType.CALLBACK_SITE_PUBLISHED,
        } as any,
      ]);

      await expect(result).rejects.toBeTruthy();
    });

    it('should fail if not correct metadata type', async (manager) => {
      const processor = new SitePublishedFutureProcessor();

      const result = processor.handle({} as any, manager, {} as any, [
        {
          type: FutureType.INTEGRATION_HD_PHOTO_HUB,
          metadata: {
            type: HdphotohubIntegrationsType.CREATE_SITE,
          },
        } as any,
      ]);

      await expect(result).rejects.toBeTruthy();
    });

    it('should fail if no dependencies', async (manager) => {
      const processor = new SitePublishedFutureProcessor();

      const result = processor.handle({} as any, manager, {} as any, []);

      await expect(result).rejects.toBeTruthy();
    });

    it('should fail if too many dependencies', async (manager) => {
      const processor = new SitePublishedFutureProcessor();

      const result = processor.handle({} as any, manager, {} as any, [{} as any, {} as any]);

      await expect(result).rejects.toBeTruthy();
    });
  });
});
