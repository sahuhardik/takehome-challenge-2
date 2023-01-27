import { HdphotohubIntegrationsType, MicrositeDeliverableStatus } from '@server/enums';
import { ImageDeliverable } from '@server/model/deliverable.entity';
import { FutureType } from '@server/services/future/Future';
import { DeliverableAddedFutureProcessor } from '@server/services/future/processor/DeliverableAddedFutureProcessor';
import { ServiceModule } from '@server/services/module';
import { nestDatabaseTest } from '@server/testing';

const describe = nestDatabaseTest({
  imports: [ServiceModule],
});

describe('DeliverableAddedFutureProcessor', (it) => {
  describe('handle', () => {
    it('should update status and media id', async (manager) => {
      const deliverable = new ImageDeliverable();
      await manager.save(deliverable);
      const processor = new DeliverableAddedFutureProcessor();

      await processor.handle(
        {} as any,
        manager,
        {
          internalDeliverableId: deliverable.id,
        },
        [
          {
            type: FutureType.INTEGRATION_HD_PHOTO_HUB,
            metadata: {
              type: HdphotohubIntegrationsType.ADD_DELIVERABLE_TO_SITE,
              response: {
                externalDeliverableId: 11111,
              },
            },
          } as any,
        ]
      );
      const { micrositeStatus, micrositeMediaId } = await manager.findOne(ImageDeliverable, deliverable.id);

      expect(micrositeStatus).toBe(MicrositeDeliverableStatus.SYNCED);
      expect(micrositeMediaId).toBe('11111');
    });

    it('should fail if not correct dependency future type', async (manager) => {
      const processor = new DeliverableAddedFutureProcessor();

      const result = processor.handle({} as any, manager, {} as any, [
        {
          type: FutureType.CALLBACK_DELIVERABLE_ADDED,
        } as any,
      ]);

      await expect(result).rejects.toBeTruthy();
    });

    it('should fail if not correct metadata type', async (manager) => {
      const processor = new DeliverableAddedFutureProcessor();

      const result = processor.handle({} as any, manager, {} as any, [
        {
          type: FutureType.INTEGRATION_HD_PHOTO_HUB,
          metadata: {
            type: HdphotohubIntegrationsType.PUBLISH_SITE,
          },
        } as any,
      ]);

      await expect(result).rejects.toBeTruthy();
    });

    it('should fail if no dependencies', async (manager) => {
      const processor = new DeliverableAddedFutureProcessor();

      const result = processor.handle({} as any, manager, {} as any, []);

      await expect(result).rejects.toBeTruthy();
    });

    it('should fail if too many dependencies', async (manager) => {
      const processor = new DeliverableAddedFutureProcessor();

      const result = processor.handle({} as any, manager, {} as any, [{} as any, {} as any]);

      await expect(result).rejects.toBeTruthy();
    });
  });
});
