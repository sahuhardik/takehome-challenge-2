import { Injectable } from '@nestjs/common';
import { StripePaymentsType } from '@server/enums';
import { AccountingServiceDelegator } from '@server/services/accounting/AccountingServiceDelegator';
import { FutureType } from '@server/services/future/Future';
import FutureMetadata, { FutureDependency } from '@server/services/future/FutureMetadata';
import FutureProcessor from '@server/services/future/FutureProcessor';
import { EntityManager } from 'typeorm';
import { Logger } from 'winston';

@Injectable()
export class InvoicePaymentFutureProcessor implements FutureProcessor<FutureType.CALLBACK_INVOICE_PAYMENT> {
  constructor(private accountingService: AccountingServiceDelegator) {}

  type = FutureType.CALLBACK_INVOICE_PAYMENT;

  async handle(
    log: Logger,
    em: EntityManager,
    metadata: FutureMetadata<FutureType.CALLBACK_INVOICE_PAYMENT>,
    dependencies: FutureDependency<FutureType.CALLBACK_INVOICE_PAYMENT>[]
  ): Promise<FutureMetadata<FutureType.CALLBACK_INVOICE_PAYMENT>> {
    if (dependencies.length !== 1) {
      throw new Error('expected only one dependency.');
    }

    const dependency = dependencies[0];

    if (dependency.type === FutureType.INTEGRATION_STRIPE_PAYMENTS) {
      if (dependency.metadata.type !== StripePaymentsType.CREATE_CHARGE) {
        throw new Error('Expecting future to be a stripe charge.');
      }

      await this.accountingService.recordInvoicePayment(
        em,
        metadata.internalInvoiceId,
        metadata.buyerRelId,
        `stripe-${dependency.metadata.response.chargeId}`,
        dependency.metadata.payload.amount,
        new Date(dependency.metadata.response.date)
      );

      return metadata;
    }

    if (dependency.type === FutureType.INTEGRATION_QUICKBOOKS_PAYMENTS) {
      throw new Error('Quickbooks not implemented.');
    }

    throw new Error('Do not recognize dependency.');
  }
}
