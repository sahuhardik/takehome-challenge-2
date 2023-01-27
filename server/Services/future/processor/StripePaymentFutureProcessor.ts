import { Inject, Injectable } from '@nestjs/common';
import { StripePaymentsType } from '@server/enums';
import { FutureType } from '@server/services/future/Future';
import FutureMetadata from '@server/services/future/FutureMetadata';
import FutureProcessor from '@server/services/future/FutureProcessor';
import { StripePaymentApi } from '@server/services/stripe/StripePaymentApi';
import { EntityManager } from 'typeorm';
import { Logger } from 'winston';

@Injectable()
export class StripePaymentFutureProcessor implements FutureProcessor<FutureType.INTEGRATION_STRIPE_PAYMENTS> {
  type = FutureType.INTEGRATION_STRIPE_PAYMENTS;

  constructor(
    @Inject('stripe_payment_live') private readonly live: StripePaymentApi,
    @Inject('stripe_payment_test') private readonly test: StripePaymentApi
  ) {}

  async handle(
    log: Logger,
    em: EntityManager,
    metadata: FutureMetadata<FutureType.INTEGRATION_STRIPE_PAYMENTS>
  ): Promise<FutureMetadata<FutureType.INTEGRATION_STRIPE_PAYMENTS>> {
    const paymentService = metadata.test ? this.test : this.live;

    switch (metadata.type) {
      case StripePaymentsType.AUTH_CHARGE:
        return {
          ...metadata,
          response: await paymentService.authorizeCharge(metadata.payload),
        };
      case StripePaymentsType.CANCEL_AUTH:
        await paymentService.cancelAuthorization(metadata.payload);

        return metadata;
      case StripePaymentsType.CAPTURE_CHARGE:
        await paymentService.captureCharge(metadata.payload);

        return metadata;
      case StripePaymentsType.ADD_PAYMENT_METHOD:
        return {
          ...metadata,
          response: await paymentService.addPaymentMethod(metadata.payload),
        };
      case StripePaymentsType.CREATE_CHARGE:
        return {
          ...metadata,
          response: await paymentService.createCharge(metadata.payload),
        };
      case StripePaymentsType.REFUND_CHARGE:
        return {
          ...metadata,
          response: await paymentService.refundCharge(metadata.payload),
        };
    }

    throw new Error(`StripePaymentsType not implemented.`);
  }
}
