import FutureMetadata from '@server/services/future/FutureMetadata';

export enum FutureType {
  INTEGRATION_QUICKBOOKS_ACCOUNTING = 'integration_quickbooks_accounting',
  INTEGRATION_QUICKBOOKS_PAYMENTS = 'integration_quickbooks_payments',
  INTEGRATION_XERO_ACCOUNTING = 'integration_xero_accounting',
  INTEGRATION_STRIPE_PAYMENTS = 'integration_stripe_payments',
  INTEGRATION_HD_PHOTO_HUB = 'integration_hd_photo_hub',
  INTEGRATION_RELA = 'integration_rela',
  CALLBACK_SITE_ADDED = 'callback_site_added',
  CALLBACK_SITE_PUBLISHED = 'callback_site_published',
  CALLBACK_DELIVERABLE_ADDED = 'callback_deliverable_added',
  CALLBACK_BUYER_USER_SYNCED = 'callback_buyer_user_synced',
  CALLBACK_ADD_SOURCE = 'callback_add_source',
  CALLBACK_ACCOUNTING_IDS = 'callback_accounting_ids',
  CALLBACK_LINES_PAID = 'callback_lines_paid',
  CALLBACK_INVOICE_PAYMENT = 'callback_invoice_payment',
  QUEUE_NOTIFICATION = 'queue_notification',
}

export enum FutureStatus {
  CREATED = 'created',

  // when the future has been handled by a processor, but the children are not completed
  PROCESSED = 'processed',

  // after both the future and its children are completed
  COMPLETED = 'completed',

  FAILED = 'failed',
}

export default interface Future<Type extends FutureType> {
  id: string;
  type: Type;
  metadata: FutureMetadata<Type>;
  status: FutureStatus;
}
