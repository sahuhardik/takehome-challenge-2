import { HdphotohubIntegrationsType, MicrositeType } from '@server/enums';
import { HdphotohubFutureProcessor } from '@server/services/future/processor/HdphotohubFutureProcessor';
import { HdphotohubApi } from '@server/services/hd-photo-hub/HdphotohubApi';
import { HdphotohubContext } from '@server/services/hd-photo-hub/HdphotohubContext';
import { ServiceModule } from '@server/services/module';
import { fixtureFullOrderServiceJob, nestDatabaseTest } from '@server/testing';
import { instance, It, mock, when } from 'strong-mock';
import { EntityManager } from 'typeorm';

const describe = nestDatabaseTest({
  imports: [ServiceModule],
});

async function fixtureCreateOrderAndJob(manager: EntityManager) {
  const { job, order, vendor, buyer, vendorBuyerRel } = await fixtureFullOrderServiceJob(manager, {
    vendor: {
      micrositeConfig: {
        defaultType: MicrositeType.HD_PHOTO_HUB,
        hdPhotoHub: {
          url: 'hdPhotoHubUrl',
          apiKey: 'hdPhotoHubApiKey',
        },
      },
      preferences: {
        collapseTimeSlots: true,
        requestTimesError: false,
        review: {
          job: false,
          order: false,
        },
        buyerNotificationWindow: {
          start: '07:30',
          stop: '21:30',
        },
        providerNotificationWindow: {
          start: '07:30',
          stop: '21:30',
        },
      },
    },
    scheduled: { date: new Date(), onsite: 30 },
  });

  return {
    job,
    order,
    vendor,
    buyer,
    vendorBuyerRel,
  };
}

function service() {
  const apiMock = mock<HdphotohubApi>();
  const contextMatcher = It.matches((context: HdphotohubContext) => context.apiKey === 'hdPhotoHubApiKey');
  const hdPhotoHubFutureProcessor = new HdphotohubFutureProcessor(instance(apiMock));

  return {
    apiMock,
    hdPhotoHubFutureProcessor,
    contextMatcher,
  };
}

describe('HdphotohubFutureProcessor', (it) => {
  describe('process', () => {
    it('ensureUserExists', async (manager) => {
      const { vendorBuyerRel } = await fixtureCreateOrderAndJob(manager);
      const { hdPhotoHubFutureProcessor, apiMock, contextMatcher } = service();
      const payload = Symbol('payload');
      const response = Symbol('response');
      when(apiMock.ensureUserExists(contextMatcher, payload as any)).thenResolve(response as any);

      const result = await hdPhotoHubFutureProcessor.handle(
        null,
        manager,
        {
          type: HdphotohubIntegrationsType.ENSURE_USER_EXISTS,
          buyerRelId: vendorBuyerRel.id,
          payload,
        } as any,
        []
      );

      expect(result).toMatchObject({
        payload,
        response,
      });
    });

    it('createSite', async (manager) => {
      const { vendorBuyerRel } = await fixtureCreateOrderAndJob(manager);
      const { hdPhotoHubFutureProcessor, apiMock, contextMatcher } = service();
      const payload = {
        externalAgentUserId: undefined,
        externalCoAgentUserId: undefined,
      };
      const response = {};
      when(apiMock.createSite(contextMatcher, payload as any)).thenResolve(response as any);

      const result = await hdPhotoHubFutureProcessor.handle(
        null,
        manager,
        {
          type: HdphotohubIntegrationsType.CREATE_SITE,
          buyerRelId: vendorBuyerRel.id,
          payload,
        } as any,
        []
      );

      expect(result).toMatchObject({
        payload,
        response,
      });
    });

    it('addDeliverableToSite', async (manager) => {
      const { vendorBuyerRel } = await fixtureCreateOrderAndJob(manager);
      const { hdPhotoHubFutureProcessor, apiMock, contextMatcher } = service();
      const payload = {
        externalSiteId: undefined,
      };
      const response = Symbol('response');
      when(apiMock.addDeliverableToSite(contextMatcher, payload as any)).thenResolve(response as any);

      const result = await hdPhotoHubFutureProcessor.handle(
        null,
        manager,
        {
          type: HdphotohubIntegrationsType.ADD_DELIVERABLE_TO_SITE,
          buyerRelId: vendorBuyerRel.id,
          payload,
        } as any,
        []
      );

      expect(result).toMatchObject({
        payload,
        response,
      });
    });

    it('sortSiteDeliverables', async (manager) => {
      const { vendorBuyerRel } = await fixtureCreateOrderAndJob(manager);
      const { hdPhotoHubFutureProcessor, apiMock, contextMatcher } = service();
      const payload = {
        externalSiteId: undefined,
        deliverableIds: [],
      };
      when(apiMock.sortSiteDeliverables(contextMatcher, payload as any)).thenResolve();

      const result = await hdPhotoHubFutureProcessor.handle(
        null,
        manager,
        {
          type: HdphotohubIntegrationsType.SORT_SITE_DELIVERABLES,
          buyerRelId: vendorBuyerRel.id,
          payload,
        } as any,
        []
      );

      expect(result).toMatchObject({
        payload,
      });
    });

    it('publishSite', async (manager) => {
      const { vendorBuyerRel } = await fixtureCreateOrderAndJob(manager);
      const { hdPhotoHubFutureProcessor, apiMock, contextMatcher } = service();
      const payload = {
        externalSiteId: undefined,
      };
      when(apiMock.publishSite(contextMatcher, payload as any)).thenResolve();

      const result = await hdPhotoHubFutureProcessor.handle(
        null,
        manager,
        {
          type: HdphotohubIntegrationsType.PUBLISH_SITE,
          buyerRelId: vendorBuyerRel.id,
          payload,
        } as any,
        []
      );

      expect(result).toMatchObject({
        payload,
      });
    });
  });
});
