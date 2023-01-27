import { Injectable } from '@nestjs/common';
import { QuickBooksAccountingType } from '@server/enums';
import Invoice, { InvoicePayment } from '@server/model/invoice.entity';
import { VendorBuyerRelationshipEntity } from '@server/model/member-relationship.entity';
import { FutureType } from '@server/services/future/Future';
import FutureMetadata, { FutureDependency } from '@server/services/future/FutureMetadata';
import FutureProcessor from '@server/services/future/FutureProcessor';
import { EntityManager } from 'typeorm';
import { Logger } from 'winston';

@Injectable()
export class AccountingIdsFutureProcessor implements FutureProcessor<FutureType.CALLBACK_ACCOUNTING_IDS> {
  type = FutureType.CALLBACK_ACCOUNTING_IDS;

  async handle(
    log: Logger,
    em: EntityManager,
    metadata: FutureMetadata<FutureType.CALLBACK_ACCOUNTING_IDS>,
    dependencies: FutureDependency<FutureType.CALLBACK_ACCOUNTING_IDS>[]
  ): Promise<FutureMetadata<FutureType.CALLBACK_ACCOUNTING_IDS>> {
    if (dependencies.length !== 1) {
      throw new Error('expected only one dependency.');
    }

    const dependency = dependencies[0];

    if (metadata.internalPaymentId) {
      if (dependency.type === FutureType.INTEGRATION_QUICKBOOKS_ACCOUNTING) {
        if (dependency.metadata.type !== QuickBooksAccountingType.CREATE_PAYMENT_FOR_INVOICE) {
          throw new Error('Expecting future to be a create payment for invoice.');
        }

        await em.update(
          InvoicePayment,
          { id: metadata.internalPaymentId },
          { quickbooksId: dependency.metadata.response.paymentId }
        );
      }
    } else if (metadata.internalInvoiceId) {
      if (dependency.type === FutureType.INTEGRATION_QUICKBOOKS_ACCOUNTING) {
        if (dependency.metadata.type !== QuickBooksAccountingType.CREATE_OR_UPDATE_INVOICE) {
          throw new Error('Expecting future to be a create or update invoice.');
        }

        await em.update(
          Invoice,
          { id: metadata.internalInvoiceId },
          { quickbooksInvoiceId: dependency.metadata.response.invoiceId }
        );

        return metadata;
      }
    } else if (metadata.buyerRelId) {
      if (dependency.type === FutureType.INTEGRATION_QUICKBOOKS_ACCOUNTING) {
        if (dependency.metadata.type !== QuickBooksAccountingType.CREATE_OR_UPDATE_CUSTOMER) {
          throw new Error('Expecting future to be a create or update invoice.');
        }

        await em.update(
          VendorBuyerRelationshipEntity,
          { id: metadata.buyerRelId },
          { quickbooksCustomerId: dependency.metadata.response.customerId }
        );

        return metadata;
      }
    }

    throw new Error('Do not recognize dependency.');
  }
}
