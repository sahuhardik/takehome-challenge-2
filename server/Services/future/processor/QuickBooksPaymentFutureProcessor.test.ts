import { QuickBooksPaymentsType } from '@server/enums';
import MemberEntity, { QuickbooksMemberConfig } from '@server/model/member.entity';
import { QuickBooksPaymentFutureProcessor } from '@server/services/future/processor/QuickBooksPaymentFutureProcessor';
import { ServiceModule } from '@server/services/module';
import { QuickBooksAuthToken } from '@server/services/quickbooks/QuickBooksAuthToken';
import { QuickBooksPaymentApi } from '@server/services/quickbooks/QuickBooksPaymentApi';
import { nestDatabaseTest } from '@server/testing';
import { instance, It, mock, when } from 'strong-mock';
import { EntityManager } from 'typeorm';

const describe = nestDatabaseTest({
  imports: [ServiceModule],
});

async function memberSetUp(manager: EntityManager) {
  const quickbooks: QuickbooksMemberConfig = {
    credentials: {
      auth: {
        token_type: 'token_type',
        access_token: 'access_token',
        expires_in: 3600,
        refresh_token: 'refresh_token',
        x_refresh_token_expires_in: 3600000,
      },
      realmId: 'realmId',
    },
    payment: {
      test: false,
      credentials: {
        auth: {
          token_type: 'token_type',
          access_token: 'access_token',
          expires_in: 3600,
          refresh_token: 'refresh_token',
          x_refresh_token_expires_in: 3600000,
        },
        realmId: 'realmId',
      },
    },
    vendorAccountId: 'vendorAccountId',
  };

  const preferences = {
    collapseTimeSlots: true,
    requestTimesError: false,
    applicationFee: '0.01',
    stripeTest: true,
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
  };

  const member = new MemberEntity();
  member.quickbooks = quickbooks;
  member.preferences = preferences;
  await manager.save(member);
  return { member };
}

function service() {
  const quickBooksPaymentApiMock = mock<QuickBooksPaymentApi>();
  const authMatcher = It.matches(
    (auth: QuickBooksAuthToken) =>
      auth.realm === 'realmId' && auth.accessToken === 'access_token' && auth.refreshToken === 'refresh_token'
  );

  const mocked = instance(quickBooksPaymentApiMock);
  const quickBooksPaymentFutureProcessor = new QuickBooksPaymentFutureProcessor(mocked, mocked);

  return {
    quickBooksPaymentFutureProcessor,
    quickBooksPaymentApiMock,
    authMatcher,
  };
}

describe('QuickBooksPaymentFutureProcessor', (it) => {
  describe('process', () => {
    it('chargeCard', async (manager) => {
      const { member } = await memberSetUp(manager);
      const { quickBooksPaymentFutureProcessor, quickBooksPaymentApiMock, authMatcher } = service();
      const payload = Symbol('payload');
      const response = Symbol('response');
      when(quickBooksPaymentApiMock.chargeCard(authMatcher, payload as any)).thenResolve(response as any);

      const result = await quickBooksPaymentFutureProcessor.handle(null, manager, {
        test: true,
        type: QuickBooksPaymentsType.CHARGE_CREDIT_CARD,
        vendorId: member.id,
        payload,
      } as any);

      expect(result).toMatchObject({
        payload,
        response,
      });
    });

    it('refundCard', async (manager) => {
      const { member } = await memberSetUp(manager);
      const { quickBooksPaymentFutureProcessor, quickBooksPaymentApiMock, authMatcher } = service();
      const payload = Symbol('payload');
      const response = Symbol('response');
      when(quickBooksPaymentApiMock.refundCard(authMatcher, payload as any)).thenResolve(response as any);

      const result = await quickBooksPaymentFutureProcessor.handle(null, manager, {
        test: true,
        type: QuickBooksPaymentsType.REFUND_CHARGE,
        vendorId: member.id,
        payload,
      } as any);

      expect(result).toMatchObject({
        payload,
        response,
      });
    });

    it('chargeECheck', async (manager) => {
      const { member } = await memberSetUp(manager);
      const { quickBooksPaymentFutureProcessor, quickBooksPaymentApiMock, authMatcher } = service();
      const payload = Symbol('payload');
      const response = Symbol('response');
      when(quickBooksPaymentApiMock.chargeECheck(authMatcher, payload as any)).thenResolve(response as any);

      const result = await quickBooksPaymentFutureProcessor.handle(null, manager, {
        test: true,
        type: QuickBooksPaymentsType.CHARGE_E_CHECK,
        vendorId: member.id,
        payload,
      } as any);

      expect(result).toMatchObject({
        payload,
        response,
      });
    });

    it('refundECheck', async (manager) => {
      const { member } = await memberSetUp(manager);
      const { quickBooksPaymentFutureProcessor, quickBooksPaymentApiMock, authMatcher } = service();
      const payload = Symbol('payload');
      const response = Symbol('response');
      when(quickBooksPaymentApiMock.refundECheck(authMatcher, payload as any)).thenResolve(response as any);

      const result = await quickBooksPaymentFutureProcessor.handle(null, manager, {
        test: true,
        type: QuickBooksPaymentsType.REFUND_E_CHECK,
        vendorId: member.id,
        payload,
      } as any);

      expect(result).toMatchObject({
        payload,
        response,
      });
    });

    it('addCard', async (manager) => {
      const { member } = await memberSetUp(manager);
      const { quickBooksPaymentFutureProcessor, quickBooksPaymentApiMock, authMatcher } = service();
      const payload = Symbol('payload');
      const response = Symbol('response');
      when(quickBooksPaymentApiMock.addCard(authMatcher, payload as any)).thenResolve(response as any);

      const result = await quickBooksPaymentFutureProcessor.handle(null, manager, {
        test: true,
        type: QuickBooksPaymentsType.ADD_CREDIT_CARD,
        vendorId: member.id,
        payload,
      } as any);

      expect(result).toMatchObject({
        payload,
        response,
      });
    });

    it('addBankAccount', async (manager) => {
      const { member } = await memberSetUp(manager);
      const { quickBooksPaymentFutureProcessor, quickBooksPaymentApiMock, authMatcher } = service();
      const payload = Symbol('payload');
      const response = Symbol('response');
      when(quickBooksPaymentApiMock.addBankAccount(authMatcher, payload as any)).thenResolve(response as any);

      const result = await quickBooksPaymentFutureProcessor.handle(null, manager, {
        test: true,
        type: QuickBooksPaymentsType.ADD_BANK_ACCOUNT,
        vendorId: member.id,
        payload,
      } as any);

      expect(result).toMatchObject({
        payload,
        response,
      });
    });
  });
});
