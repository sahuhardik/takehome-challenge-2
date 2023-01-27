import { HdphotohubIntegrationsType } from '@server/enums';
import { VendorBuyerRelationshipEntity } from '@server/model/member-relationship.entity';
import { FutureType } from '@server/services/future/Future';
import { BuyerUserSyncedFutureProcessor } from '@server/services/future/processor/BuyerUserSyncedFutureProcessor';
import { ServiceModule } from '@server/services/module';
import { nestDatabaseTest } from '@server/testing';

const describe = nestDatabaseTest({
  imports: [ServiceModule],
});

describe('BuyerUserSyncedFutureProcessor', (it) => {
  describe('handle', () => {
    it('should update status and external id', async (manager) => {
      const buyerRel = new VendorBuyerRelationshipEntity();
      await manager.save(buyerRel);
      const processor = new BuyerUserSyncedFutureProcessor();

      const result = await processor.handle(
        {} as any,
        manager,
        {
          buyerRelId: buyerRel.id,
        },
        [
          {
            type: FutureType.INTEGRATION_HD_PHOTO_HUB,
            metadata: {
              type: HdphotohubIntegrationsType.ENSURE_USER_EXISTS,
              response: {
                externalUserId: 11111,
              },
              payload: {
                primary: true,
              },
            },
          } as any,
        ]
      );
      const { micrositeUserId } = await manager.findOne(VendorBuyerRelationshipEntity, buyerRel.id);

      expect(micrositeUserId).toBe('11111');
      expect(result).not.toBe(false);
      if (result !== false) {
        expect(result.externalUserId).toBe('11111');
      }
    });

    it('should fail if not correct dependency future type', async (manager) => {
      const processor = new BuyerUserSyncedFutureProcessor();

      const result = processor.handle({} as any, manager, {} as any, [
        {
          type: FutureType.CALLBACK_BUYER_USER_SYNCED,
        } as any,
      ]);

      await expect(result).rejects.toBeTruthy();
    });

    it('should fail if not correct metadata type', async (manager) => {
      const processor = new BuyerUserSyncedFutureProcessor();

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
      const processor = new BuyerUserSyncedFutureProcessor();

      const result = processor.handle({} as any, manager, {} as any, []);

      await expect(result).rejects.toBeTruthy();
    });

    it('should fail if too many dependencies', async (manager) => {
      const processor = new BuyerUserSyncedFutureProcessor();

      const result = processor.handle({} as any, manager, {} as any, [{} as any, {} as any]);

      await expect(result).rejects.toBeTruthy();
    });
  });
});
