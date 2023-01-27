import {
  HdphotohubIntegrationsType,
  QuickBooksAccountingType,
  QuickBooksPaymentsType,
  RelaIntegrationsType,
  StripePaymentsType,
} from '@server/enums';
import Future, { FutureType } from '@server/services/future/Future';
import {
  AddDeliverableToSitePayload,
  AddDeliverableToSiteResponse,
  CreateSitePayload,
  CreateSiteResponse,
  EnsureUserExistsPayload,
  EnsureUserExistsResponse,
  PublishSitePayload,
  PublishSiteResponse,
  SortSiteDeliverablesPayload,
  SortSiteDeliverablesResponse,
} from '@server/services/hd-photo-hub/types';
import {
  QuickBooksInputBill,
  QuickBooksInputCustomer,
  QuickBooksInputInvoice,
  QuickBooksInputInvoiceCredit,
  QuickBooksInputInvoiceLine,
  QuickBooksInputInvoiceLineRemove,
  QuickBooksInputInvoicePayment,
  QuickBooksInputVendor,
  QuickBooksPaymentsBankAccount,
  QuickBooksPaymentsCard,
  QuickBooksPaymentsCardCharge,
  QuickBooksPaymentsECheck,
  QuickBooksPaymentsInputAddBankAccount,
  QuickBooksPaymentsInputAddCard,
  QuickBooksPaymentsInputChargeCard,
  QuickBooksPaymentsInputChargeECheck,
  QuickBooksPaymentsInputRefundCard,
  QuickBooksPaymentsInputRefundECheck,
  QuickBooksPaymentsRefundCard,
  QuickBooksPaymentsRefundECheck,
} from '@server/services/quickbooks/types';
import {
  RelaAddDeliverableToSitePayload,
  RelaAddDeliverableToSiteResponse,
  RelaCreateSitePayload,
  RelaCreateSiteResponse,
  RelaEnsureUserExistsPayload,
  RelaEnsureUserExistsResponse,
  RelaPublishSitePayload,
  RelaPublishSiteResponse,
  RelaSortSiteDeliverablesPayload,
  RelaSortSiteDeliverablesResponse,
} from '@server/services/rela/types';
import {
  AddPaymentMethodParams,
  Authorization,
  CaptureChargeParams,
  Charge,
  CreateChargeParams,
  PaymentMethod,
  Refund,
  RefundChargeParams,
} from '@server/services/stripe/types';

interface QBAM<T extends QuickBooksAccountingType, P, R> {
  memberId: string;
  type: T;
  payload: P;
  response?: R;
}

export type QuickBooksAccountingMetadata =
  | QBAM<
      QuickBooksAccountingType.CREATE_OR_UPDATE_BILL,
      Omit<QuickBooksInputBill, 'date' | 'externalVendorId'> & { date: string; externalVendorId?: string },
      { billId: string }
    >
  | QBAM<QuickBooksAccountingType.EMAIL_INVOICE, { externalInvoiceId?: string }, never>
  | QBAM<QuickBooksAccountingType.VOID_INVOICE, { externalInvoiceId?: string }, never>
  | QBAM<
      QuickBooksAccountingType.CREATE_OR_UPDATE_INVOICE_LINE_ITEM,
      QuickBooksInputInvoiceLine & { internalInvoiceNumber: number },
      never
    >
  | QBAM<QuickBooksAccountingType.CREATE_OR_UPDATE_CUSTOMER, QuickBooksInputCustomer, { customerId: string }>
  | QBAM<QuickBooksAccountingType.CREATE_OR_UPDATE_INVOICE, QuickBooksInputInvoice, { invoiceId: string }>
  | QBAM<QuickBooksAccountingType.CREATE_OR_UPDATE_VENDOR, QuickBooksInputVendor, { vendorId: string }>
  | QBAM<
      QuickBooksAccountingType.CREATE_PAYMENT_FOR_INVOICE,
      Omit<QuickBooksInputInvoicePayment, 'externalCustomerId'> & { externalCustomerId?: string },
      { paymentId: string }
    >
  | QBAM<QuickBooksAccountingType.CREATE_CREDIT_FOR_INVOICE, QuickBooksInputInvoiceCredit, { creditId: string }>
  | QBAM<QuickBooksAccountingType.REMOVE_INVOICE_LINE, QuickBooksInputInvoiceLineRemove, never>;

interface SPM<T extends StripePaymentsType, P, R> {
  type: T;
  payload: P;
  response?: R;
  test: boolean;
  // buyerRelId?: string;
  // buyerId?: string;
  vendorId?: string;
}

export type StripePaymentsMetadata =
  | SPM<StripePaymentsType.ADD_PAYMENT_METHOD, AddPaymentMethodParams, PaymentMethod>
  | SPM<StripePaymentsType.CREATE_CHARGE, CreateChargeParams, Charge>
  | SPM<StripePaymentsType.AUTH_CHARGE, CreateChargeParams, Authorization>
  | SPM<StripePaymentsType.REFUND_CHARGE, RefundChargeParams, Refund>
  | SPM<StripePaymentsType.CANCEL_AUTH, CaptureChargeParams, never>
  | SPM<StripePaymentsType.CAPTURE_CHARGE, CaptureChargeParams, { cleared: boolean }>;

export interface HDPM<T extends HdphotohubIntegrationsType, P, R> {
  type: T;
  payload: P;
  response?: R;
  buyerRelId: string;
}

export type HdPhotoHubMetadata =
  | HDPM<HdphotohubIntegrationsType.ENSURE_USER_EXISTS, EnsureUserExistsPayload, EnsureUserExistsResponse>
  | HDPM<HdphotohubIntegrationsType.CREATE_SITE, CreateSitePayload, CreateSiteResponse>
  | HDPM<HdphotohubIntegrationsType.ADD_DELIVERABLE_TO_SITE, AddDeliverableToSitePayload, AddDeliverableToSiteResponse>
  | HDPM<HdphotohubIntegrationsType.SORT_SITE_DELIVERABLES, SortSiteDeliverablesPayload, SortSiteDeliverablesResponse>
  | HDPM<HdphotohubIntegrationsType.PUBLISH_SITE, PublishSitePayload, PublishSiteResponse>;

export interface RELAPM<T extends RelaIntegrationsType, P, R> {
  type: T;
  payload: P;
  response?: R;
  buyerRelId: string;
}

export type RelaMetadata =
  | RELAPM<RelaIntegrationsType.ENSURE_USER_EXISTS, RelaEnsureUserExistsPayload, RelaEnsureUserExistsResponse>
  | RELAPM<RelaIntegrationsType.CREATE_SITE, RelaCreateSitePayload, RelaCreateSiteResponse>
  | RELAPM<
      RelaIntegrationsType.ADD_DELIVERABLE_TO_SITE,
      RelaAddDeliverableToSitePayload,
      RelaAddDeliverableToSiteResponse
    >
  | RELAPM<
      RelaIntegrationsType.SORT_SITE_DELIVERABLES,
      RelaSortSiteDeliverablesPayload,
      RelaSortSiteDeliverablesResponse
    >
  | RELAPM<RelaIntegrationsType.PUBLISH_SITE, RelaPublishSitePayload, RelaPublishSiteResponse>;

interface QBPM<T extends QuickBooksPaymentsType, P, R> {
  type: T;
  test: boolean;
  payload: P;
  response?: R;
  vendorId?: string;
}

export type QuickBooksPaymentsMetadata =
  | QBPM<QuickBooksPaymentsType.ADD_CREDIT_CARD, QuickBooksPaymentsInputAddCard, QuickBooksPaymentsCard>
  | QBPM<QuickBooksPaymentsType.ADD_BANK_ACCOUNT, QuickBooksPaymentsInputAddBankAccount, QuickBooksPaymentsBankAccount>
  | QBPM<QuickBooksPaymentsType.CAPTURE_CHARGE, QuickBooksPaymentsCardCharge, never>
  | QBPM<QuickBooksPaymentsType.CANCEL_AUTH, QuickBooksPaymentsCardCharge, never>
  | QBPM<QuickBooksPaymentsType.AUTH_CREDIT_CARD, QuickBooksPaymentsInputChargeCard, QuickBooksPaymentsCardCharge>
  | QBPM<QuickBooksPaymentsType.CHARGE_CREDIT_CARD, QuickBooksPaymentsInputChargeCard, QuickBooksPaymentsCardCharge>
  | QBPM<QuickBooksPaymentsType.CHARGE_E_CHECK, QuickBooksPaymentsInputChargeECheck, QuickBooksPaymentsECheck>
  | QBPM<QuickBooksPaymentsType.REFUND_CHARGE, QuickBooksPaymentsInputRefundCard, QuickBooksPaymentsRefundCard>
  | QBPM<QuickBooksPaymentsType.REFUND_E_CHECK, QuickBooksPaymentsInputRefundECheck, QuickBooksPaymentsRefundECheck>;

export interface AddSourceMetadata {
  name: string;
  setDefault: boolean;
  buyerRelId: string;
  sourceId?: string;
}

type Mapping = {
  [FutureType.CALLBACK_LINES_PAID]: {
    metadata: { lineIds: string[] };
    dependencies: Future<FutureType>;
  };
  [FutureType.CALLBACK_INVOICE_PAYMENT]: {
    metadata: { internalInvoiceId: string; buyerRelId: string };
    dependencies: Future<FutureType.INTEGRATION_STRIPE_PAYMENTS> | Future<FutureType.INTEGRATION_QUICKBOOKS_PAYMENTS>;
  };
  [FutureType.INTEGRATION_STRIPE_PAYMENTS]: {
    metadata: StripePaymentsMetadata;
    dependencies: never;
  };
  [FutureType.INTEGRATION_QUICKBOOKS_PAYMENTS]: {
    metadata: QuickBooksPaymentsMetadata;
    dependencies: never;
  };
  [FutureType.INTEGRATION_HD_PHOTO_HUB]: {
    metadata: HdPhotoHubMetadata;
    dependencies:
      | Future<FutureType.CALLBACK_BUYER_USER_SYNCED>
      | Future<FutureType.CALLBACK_SITE_ADDED>
      | Future<FutureType.CALLBACK_DELIVERABLE_ADDED>;
  };
  [FutureType.INTEGRATION_RELA]: {
    metadata: RelaMetadata;
    dependencies:
      | Future<FutureType.CALLBACK_BUYER_USER_SYNCED>
      | Future<FutureType.CALLBACK_SITE_ADDED>
      | Future<FutureType.CALLBACK_DELIVERABLE_ADDED>;
  };
  [FutureType.INTEGRATION_QUICKBOOKS_ACCOUNTING]: {
    metadata: QuickBooksAccountingMetadata;
    dependencies: Future<FutureType.INTEGRATION_QUICKBOOKS_ACCOUNTING> | undefined;
  };
  [FutureType.INTEGRATION_XERO_ACCOUNTING]: { metadata: never; dependencies: never };
  [FutureType.CALLBACK_ACCOUNTING_IDS]: {
    metadata: { buyerRelId?: string; internalInvoiceId?: string; internalPaymentId?: string };
    dependencies: Future<FutureType.INTEGRATION_QUICKBOOKS_ACCOUNTING>;
  };
  [FutureType.CALLBACK_ADD_SOURCE]: {
    metadata: AddSourceMetadata;
    dependencies: Future<FutureType.INTEGRATION_STRIPE_PAYMENTS> | Future<FutureType.INTEGRATION_QUICKBOOKS_PAYMENTS>;
  };
  [FutureType.CALLBACK_SITE_ADDED]: {
    metadata: { internalOrderId: string; externalSiteId?: string };
    dependencies: Future<FutureType.INTEGRATION_HD_PHOTO_HUB> | Future<FutureType.INTEGRATION_RELA>;
  };
  [FutureType.CALLBACK_DELIVERABLE_ADDED]: {
    metadata: { internalDeliverableId: string; externalMediaId?: string };
    dependencies: Future<FutureType.INTEGRATION_HD_PHOTO_HUB> | Future<FutureType.INTEGRATION_RELA>;
  };
  [FutureType.CALLBACK_BUYER_USER_SYNCED]: {
    metadata: { buyerRelId: string; externalUserId?: string };
    dependencies: Future<FutureType.INTEGRATION_HD_PHOTO_HUB> | Future<FutureType.INTEGRATION_RELA>;
  };
  [FutureType.CALLBACK_SITE_PUBLISHED]: {
    metadata: { internalOrderId: string };
    dependencies: Future<FutureType.INTEGRATION_HD_PHOTO_HUB> | Future<FutureType.INTEGRATION_RELA>;
  };
  [FutureType.QUEUE_NOTIFICATION]: {
    metadata: never;
    dependencies: never;
  };
};

type FutureMetadata<T extends FutureType> = Mapping[T]['metadata'];

export default FutureMetadata;

export type FutureDependency<T extends FutureType> = Mapping[T]['dependencies'];
