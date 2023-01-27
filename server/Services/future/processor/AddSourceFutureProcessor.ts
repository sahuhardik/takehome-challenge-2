import { Injectable } from '@nestjs/common';
import { QuickBooksPaymentsType, SourceType, StripePaymentsType } from '@server/enums';
import PaymentSourceEntity, { QuickBooksSourceEntity, StripeSourceEntity } from '@server/model/PaymentSourceEntity';
import { FutureType } from '@server/services/future/Future';
import FutureMetadata, { FutureDependency } from '@server/services/future/FutureMetadata';
import FutureProcessor from '@server/services/future/FutureProcessor';
import { QuickBooksPaymentsBankAccount, QuickBooksPaymentsCard } from '@server/services/quickbooks/types';
import { EntityManager } from 'typeorm';
import { Logger } from 'winston';

@Injectable()
export class AddSourceFutureProcessor implements FutureProcessor<FutureType.CALLBACK_ADD_SOURCE> {
  type = FutureType.CALLBACK_ADD_SOURCE;

  async handle(
    log: Logger,
    em: EntityManager,
    metadata: FutureMetadata<FutureType.CALLBACK_ADD_SOURCE>,
    dependencies: FutureDependency<FutureType.CALLBACK_ADD_SOURCE>[]
  ): Promise<FutureMetadata<FutureType.CALLBACK_ADD_SOURCE>> {
    if (dependencies.length !== 1) {
      throw new Error('expected only one dependency.');
    }

    const dependency = dependencies[0];

    let created: PaymentSourceEntity<unknown>;

    if (dependency.type === FutureType.INTEGRATION_STRIPE_PAYMENTS) {
      if (dependency.metadata.type !== StripePaymentsType.ADD_PAYMENT_METHOD) {
        throw new Error(`Invalid stripe payment type.`);
      }

      const response = dependency.metadata.response;

      if (response.object === 'card') {
        const { id, brand, last4, month, year } = response;

        const source = new StripeSourceEntity();
        source.name = metadata.name || `${brand} (${last4})`;
        source.buyerRelId = metadata.buyerRelId;
        source.info = {
          type: SourceType.CARD,
          customerId: response.customer,
          test: dependency.metadata.test,
          id,
          brand,
          month,
          year,
          last4,
        };

        created = source;
      } else if (response.object === 'bank_account') {
        const { id, holder_name, holder_type, routing_number, account_number } = response;

        const source = new StripeSourceEntity();
        source.name = metadata.name || `${holder_name} (${routing_number})`;
        source.buyerRelId = metadata.buyerRelId;
        source.info = {
          id,
          type: SourceType.BANK_ACCOUNT,
          customerId: response.customer,
          test: dependency.metadata.test,
          holder_name,
          holder_type,
          routing_number,
          account_number,
        };

        created = source;
      }
    } else if (dependency.type === FutureType.INTEGRATION_QUICKBOOKS_PAYMENTS) {
      if (dependency.metadata.type === QuickBooksPaymentsType.ADD_CREDIT_CARD) {
        const response: QuickBooksPaymentsCard = dependency.metadata.response;
        const source = new QuickBooksSourceEntity();
        const last4 = response.number?.substring(response.number?.length - 4);
        source.name = metadata.name || `${response.cardType} (${last4})`;
        source.buyerRelId = metadata.buyerRelId;
        source.info = {
          id: response.id,
          type: SourceType.CARD,
          brand: response.cardType,
          test: dependency.metadata.test,
          month: parseInt(response.expMonth),
          year: parseInt(response.expYear),
          last4,
        };

        created = source;
      } else if (dependency.metadata.type === QuickBooksPaymentsType.ADD_BANK_ACCOUNT) {
        const response: QuickBooksPaymentsBankAccount = dependency.metadata.response;
        const source = new QuickBooksSourceEntity();
        source.name = `${response.name} (${response.accountNumber})`;
        source.buyerRelId = metadata.buyerRelId;
        source.info = {
          id: response.id,
          type: SourceType.BANK_ACCOUNT,
          test: dependency.metadata.test,
          holder_name: response.name,
          holder_type:
            response.accountType === 'PERSONAL_CHECKING' || response.accountType === 'PERSONAL_SAVINGS'
              ? 'individual'
              : 'company',
          routing_number: response.routingNumber,
          account_number: response.accountNumber,
        };

        created = source;
      }
    }

    if (!created) {
      throw new Error('Expected a source entity to be created');
    }

    if (metadata.setDefault) {
      await em.update(PaymentSourceEntity, { buyerRelId: metadata.buyerRelId }, { primary: false });

      created.primary = true;
    }

    await em.save(created);

    return { ...metadata, sourceId: created.id };
  }
}
