import { Injectable } from '@nestjs/common';
import { QuickBooksAccountingType } from '@server/enums';
import MemberEntity from '@server/model/member.entity';
import { FutureType } from '@server/services/future/Future';
import FutureMetadata, { FutureDependency } from '@server/services/future/FutureMetadata';
import FutureProcessor from '@server/services/future/FutureProcessor';
import { QuickBooksAccountingApi } from '@server/services/quickbooks/QuickBooksAccountingApi';
import { QuickBooksApiWrapper } from '@server/services/quickbooks/QuickBooksApiWrapper';
import { QuickBooksAuthToken } from '@server/services/quickbooks/QuickBooksAuthToken';
import { EntityManager } from 'typeorm/index';
import { Logger } from 'winston';

@Injectable()
export class QuickBooksAccountingFutureProcessor
  implements FutureProcessor<FutureType.INTEGRATION_QUICKBOOKS_ACCOUNTING>
{
  constructor(private api: QuickBooksApiWrapper, private accounting: QuickBooksAccountingApi) {}

  type = FutureType.INTEGRATION_QUICKBOOKS_ACCOUNTING;

  async handle(
    log: Logger,
    em: EntityManager,
    metadata: FutureMetadata<FutureType.INTEGRATION_QUICKBOOKS_ACCOUNTING>,
    dependencies: FutureDependency<FutureType.INTEGRATION_QUICKBOOKS_ACCOUNTING>[]
  ): Promise<FutureMetadata<FutureType.INTEGRATION_QUICKBOOKS_ACCOUNTING> | false> {
    const auth = await this.getAuth(em, metadata.memberId);

    try {
      switch (metadata.type) {
        case QuickBooksAccountingType.CREATE_OR_UPDATE_BILL: {
          if (dependencies.length > 1) {
            throw new Error('do not support more than one dependency');
          }

          const dependency = dependencies[0];

          let externalVendorId = metadata.payload.externalVendorId;

          if (!externalVendorId) {
            if (!dependency) {
              throw new Error('externalVendorId is missing and no dependency was provided.');
            }

            if (dependency.metadata.type !== QuickBooksAccountingType.CREATE_OR_UPDATE_VENDOR) {
              throw new Error('dependency is not a create_or_update future');
            }

            externalVendorId = dependency.metadata.response.vendorId;
          }

          if (!externalVendorId) {
            throw new Error('externalVendorId is missing.');
          }

          return {
            ...metadata,
            response: {
              billId: await this.accounting.createOrUpdateBill(auth, {
                ...metadata.payload,
                externalVendorId,
                date: metadata.payload.date ? new Date(metadata.payload.date) : undefined,
              }),
            },
          };
        }
        case QuickBooksAccountingType.CREATE_OR_UPDATE_CUSTOMER:
          return {
            ...metadata,
            response: {
              customerId: await this.accounting.createOrUpdateCustomer(auth, metadata.payload),
            },
          };
        case QuickBooksAccountingType.CREATE_OR_UPDATE_INVOICE: {
          let externalCustomerId = metadata.payload.externalCustomerId;

          for (const dependency of dependencies) {
            if (dependency.metadata.type === QuickBooksAccountingType.CREATE_OR_UPDATE_CUSTOMER) {
              externalCustomerId = dependency.metadata.response.customerId;
            }
          }

          return {
            ...metadata,
            response: {
              invoiceId: await this.accounting.createOrUpdateInvoice(auth, {
                ...metadata.payload,
                externalCustomerId,
                date: metadata.payload.date,
              }),
            },
          };
        }
        case QuickBooksAccountingType.CREATE_OR_UPDATE_INVOICE_LINE_ITEM:
          await this.accounting.createOrUpdateInvoiceLineItem(auth, metadata.payload);

          return metadata;
        case QuickBooksAccountingType.CREATE_OR_UPDATE_VENDOR:
          return {
            ...metadata,
            response: {
              vendorId: await this.accounting.createOrUpdateVendor(auth, metadata.payload),
            },
          };
        case QuickBooksAccountingType.VOID_INVOICE: {
          await this.accounting.voidInvoice(auth, metadata.payload.externalInvoiceId);

          return metadata;
        }
        case QuickBooksAccountingType.EMAIL_INVOICE: {
          let externalInvoiceId = metadata.payload.externalInvoiceId;

          for (const dependency of dependencies) {
            if (dependency.metadata.type === QuickBooksAccountingType.CREATE_OR_UPDATE_INVOICE) {
              externalInvoiceId = dependency.metadata.response.invoiceId;
            }
          }

          if (!externalInvoiceId) {
            throw new Error('externalInvoiceId is missing and no dependency was provided.');
          }

          await this.accounting.sendEmail(auth, externalInvoiceId);

          return metadata;
        }
        case QuickBooksAccountingType.CREATE_PAYMENT_FOR_INVOICE: {
          let externalCustomerId = metadata.payload.externalCustomerId;
          let externalInvoiceId = metadata.payload.externalInvoiceId;

          for (const dependency of dependencies) {
            if (dependency.metadata.type === QuickBooksAccountingType.CREATE_OR_UPDATE_CUSTOMER) {
              externalCustomerId = dependency.metadata.response.customerId;
            }

            if (dependency.metadata.type === QuickBooksAccountingType.CREATE_OR_UPDATE_INVOICE) {
              externalInvoiceId = dependency.metadata.response.invoiceId;
            }
          }

          if (!externalCustomerId) {
            throw new Error('externalCustomerId is missing and no dependency was provided.');
          }

          if (!externalInvoiceId) {
            throw new Error('externalInvoiceId is missing and no dependency was provided.');
          }

          const paymentId = await this.accounting.createPaymentForInvoice(auth, {
            ...metadata.payload,
            date: metadata.payload.date ? new Date(metadata.payload.date) : undefined,
            externalCustomerId,
            externalInvoiceId,
          });

          if (paymentId === false) {
            return false;
          }

          return {
            ...metadata,
            response: {
              paymentId,
            },
          };
        }
        case QuickBooksAccountingType.REMOVE_INVOICE_LINE:
          await this.accounting.removeInvoiceLine(auth, metadata.payload);

          return metadata;
      }
    } catch (ex) {
      if (ex.message.includes('Stale Object Error') || ex.message.includes('Duplicate Document Number')) {
        return false; // try again later
      }

      throw ex;
    }

    throw new Error(`QuickBooksAccountingType not implemented.`);
  }

  private async getAuth(em: EntityManager, memberId: string) {
    const member = await em.findOne(MemberEntity, memberId);

    return new QuickBooksAuthToken(em, member);
  }
}
