import { StripePaymentsType } from '@server/enums';
import { StripePaymentFutureProcessor } from '@server/services/future/processor/StripePaymentFutureProcessor';
import { StripePaymentApi } from '@server/services/stripe/StripePaymentApi';
import { instance, mock, when } from 'strong-mock';

function service() {
  const stripePaymentLiveServiceMock = mock<StripePaymentApi>();
  const stripePaymentTestServiceMock = mock<StripePaymentApi>();

  const vendorPaymentService = new StripePaymentFutureProcessor(
    instance(stripePaymentLiveServiceMock),
    instance(stripePaymentTestServiceMock)
  );

  return {
    vendorPaymentService,
    stripePaymentLiveServiceMock,
    stripePaymentTestServiceMock,
  };
}

describe('StripePaymentFutureProcessor', () => {
  describe('process', () => {
    it('should process charge', async () => {
      const { vendorPaymentService, stripePaymentLiveServiceMock } = service();
      const payload = Symbol('payload');
      const response = Symbol('response');
      when(stripePaymentLiveServiceMock.createCharge(payload as any)).thenResolve(response as any);

      const result = await vendorPaymentService.handle(null, null, {
        test: false,
        type: StripePaymentsType.CREATE_CHARGE,
        payload,
      } as any);

      expect(result).toMatchObject({
        payload,
        response,
      });
    });

    it('should process add payment method', async () => {
      const { vendorPaymentService, stripePaymentTestServiceMock } = service();
      const payload = Symbol('payload');
      const response = Symbol('response');
      when(stripePaymentTestServiceMock.addPaymentMethod(payload as any)).thenResolve(response as any);

      const result = await vendorPaymentService.handle(null, null, {
        test: true,
        type: StripePaymentsType.ADD_PAYMENT_METHOD,
        payload,
      } as any);

      expect(result).toMatchObject({
        payload,
        response,
      });
    });

    it('should process refund', async () => {
      const { vendorPaymentService, stripePaymentTestServiceMock } = service();
      const payload = Symbol('payload');
      const response = Symbol('response');
      when(stripePaymentTestServiceMock.refundCharge(payload as any)).thenResolve(response as any);

      const result = await vendorPaymentService.handle(null, null, {
        test: true,
        type: StripePaymentsType.REFUND_CHARGE,
        payload,
      } as any);

      expect(result).toMatchObject({
        payload,
        response,
      });
    });
  });
});
