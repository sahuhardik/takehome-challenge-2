import { MicrositeType, RelaIntegrationsType } from '@server/enums';
import { RelaFutureProcessor } from '@server/services/future/processor/RelaFutureProcessor';
import { ServiceModule } from '@server/services/module';
import { RelaApi } from '@server/services/rela/RelaApi';
import { RelaContext } from '@server/services/rela/RelaContext';
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
        defaultType: MicrositeType.RELA,
        rela: {
          apiKey: 'apiKey',
          token: 'token',
          uid: 'uid',
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
  const apiMock = mock<RelaApi>();
  const contextMatcher = It.matches((context: RelaContext) => context.token === 'token');
  const relaFutureProcessor = new RelaFutureProcessor(instance(apiMock));

  return {
    apiMock,
    relaFutureProcessor,
    contextMatcher,
  };
}

describe('RelaFutureProcessor', (it) => {
  describe('process', () => {
    it('ensureUserExists', async (manager) => {
      const { vendorBuyerRel } = await fixtureCreateOrderAndJob(manager);
      const { relaFutureProcessor, apiMock, contextMatcher } = service();
      const payload = Symbol('payload');
      const response = Symbol('response');
      when(apiMock.ensureUserExists(contextMatcher, payload as any)).thenResolve(response as any);

      const result = await relaFutureProcessor.handle(
        null,
        manager,
        {
          type: RelaIntegrationsType.ENSURE_USER_EXISTS,
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
      const { relaFutureProcessor, apiMock, contextMatcher } = service();
      const payload = {
        externalAgentUserId: undefined,
        externalCoAgentUserId: undefined,
      };
      const response = {};
      when(apiMock.createSite(contextMatcher, payload as any)).thenResolve(response as any);

      const result = await relaFutureProcessor.handle(
        null,
        manager,
        {
          type: RelaIntegrationsType.CREATE_SITE,
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
      const { relaFutureProcessor, apiMock, contextMatcher } = service();
      const payload = {
        externalSiteId: undefined,
      };
      const response = Symbol('response');
      when(apiMock.addDeliverableToSite(contextMatcher, payload as any)).thenResolve(response as any);

      const result = await relaFutureProcessor.handle(
        null,
        manager,
        {
          type: RelaIntegrationsType.ADD_DELIVERABLE_TO_SITE,
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

    it('publishSite', async (manager) => {
      const { vendorBuyerRel } = await fixtureCreateOrderAndJob(manager);
      const { relaFutureProcessor, apiMock, contextMatcher } = service();
      const payload = {
        externalSiteId: undefined,
      };
      when(apiMock.publishSite(contextMatcher, payload as any)).thenResolve();

      const result = await relaFutureProcessor.handle(
        null,
        manager,
        {
          type: RelaIntegrationsType.PUBLISH_SITE,
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
