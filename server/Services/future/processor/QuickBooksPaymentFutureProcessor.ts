import { Inject, Injectable } from '@nestjs/common';
import { QuickBooksPaymentsType, SourceType } from '@server/enums';
import MemberEntity from '@server/model/member.entity';
import { QuickBooksSourceEntity } from '@server/model/PaymentSourceEntity';
import { FutureType } from '@server/services/future/Future';
import FutureMetadata from '@server/services/future/FutureMetadata';
import FutureProcessor from '@server/services/future/FutureProcessor';
import { QuickBooksAuthToken } from '@server/services/quickbooks/QuickBooksAuthToken';
import { QuickBooksPaymentApi } from '@server/services/quickbooks/QuickBooksPaymentApi';
import { EntityManager } from 'typeorm';
import { Logger } from 'winston';

@Injectable()
export class QuickBooksPaymentFutureProcessor implements FutureProcessor<FutureType.INTEGRATION_QUICKBOOKS_PAYMENTS> {
  type = FutureType.INTEGRATION_QUICKBOOKS_PAYMENTS;

  constructor(
    @Inject('qb_payment_live') private readonly live: QuickBooksPaymentApi,
    @Inject('qb_payment_test') private readonly test: QuickBooksPaymentApi
  ) {}

  async handle(
    log: Logger,
    em: EntityManager,
    metadata: FutureMetadata<FutureType.INTEGRATION_QUICKBOOKS_PAYMENTS>
  ): Promise<FutureMetadata<FutureType.INTEGRATION_QUICKBOOKS_PAYMENTS>> {
    const api = metadata.test ? this.test : this.live;
    const auth = await this.getAuth(em, metadata.vendorId);

    switch (metadata.type) {
      case QuickBooksPaymentsType.CHARGE_E_CHECK:
        return {
          ...metadata,
          response: await api.chargeECheck(auth, metadata.payload),
        };
      case QuickBooksPaymentsType.AUTH_CREDIT_CARD:
        return {
          ...metadata,
          response: await api.authorizeCard(auth, metadata.payload),
        };
      case QuickBooksPaymentsType.CANCEL_AUTH:
        try {
          await api.voidCharge(auth, metadata.payload);
        } catch (ex) {
          if (ex.code === 'PMT-4000') {
            // auth cannot be voided if too old
            return metadata;
          }

          throw ex;
        }

        return metadata;
      case QuickBooksPaymentsType.CAPTURE_CHARGE:
        await api.captureCharge(auth, metadata.payload);

        return metadata;
      case QuickBooksPaymentsType.CHARGE_CREDIT_CARD:
        return {
          ...metadata,
          response: await api.chargeCard(auth, metadata.payload),
        };
      case QuickBooksPaymentsType.ADD_BANK_ACCOUNT:
        return {
          ...metadata,
          response: await api.addBankAccount(auth, metadata.payload),
        };
      case QuickBooksPaymentsType.ADD_CREDIT_CARD:
        try {
          return {
            ...metadata,
            response: await api.addCard(auth, metadata.payload),
          };
        } catch (ex) {
          if (!metadata.test || (ex.code !== 'PMT-4009' && ex.response?.status !== 409)) {
            throw ex;
          }

          const cardId = (ex.detail || ex.response?.data?.errors?.[0]?.detail).replace(/[^0-9]+/g, '');

          if (!cardId) {
            throw new Error('Could not extract conflicting card id from exception.');
          }

          // card already exists, add it anyway
          const source = await em
            .createQueryBuilder()
            .select('p')
            .from(QuickBooksSourceEntity, 'p')
            .where("p.info->>'id' = :id", { id: cardId })
            .getOne();

          if (!source || source.info.type !== SourceType.CARD) {
            throw new Error('Expected to find valid test source.');
          }

          return {
            ...metadata,
            response: {
              id: cardId,
              token: metadata.payload.token,
              number: 'xxxxxxxxxxxx1111',
              expYear: `${source.info.year}`,
              cardType: source.info.brand as any,
              expMonth: `${source.info.month}`,
              internalCustomerId: metadata.payload.internalCustomerId,
            },
          };
        }
      case QuickBooksPaymentsType.REFUND_CHARGE:
        return {
          ...metadata,
          response: await api.refundCard(auth, metadata.payload),
        };
      case QuickBooksPaymentsType.REFUND_E_CHECK:
        return {
          ...metadata,
          response: await api.refundECheck(auth, metadata.payload),
        };
    }

    throw new Error(`QuickBooksPaymentsType not implemented.`);
  }

  private async getAuth(em: EntityManager, memberId: string) {
    const member = await em.findOne(MemberEntity, memberId);

    return new QuickBooksAuthToken(em, member, true);
  }
}
