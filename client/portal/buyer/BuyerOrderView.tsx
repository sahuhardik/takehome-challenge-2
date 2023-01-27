import { useState } from '@hookstate/core';
import { captureException } from '@sentry/react';
import CreditCardBrand from 'client/global/components/CreditCardBrand';
import FormArrayCheckbox from 'client/global/components/form/FormArrayCheckbox';
import DeliverablePreview from 'client/global/components/model/DeliverablePreview';
import OrderServiceAndCostTable from 'client/global/components/OrderServiceAndCostTable';
import Requested from 'client/global/components/Requested';
import Card from 'client/global/components/tailwind/Card';
import DescriptionColumns, { DescriptionColumnsItem } from 'client/global/components/tailwind/DescriptionColumns';
import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import Modal from 'client/global/components/tailwind/Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import AddressLayout from 'client/global/layout/AddressLayout';
import { useQueryParams } from 'client/global/NavigationUtil';
import BuyerPaymentQuickbooks from 'client/portal/buyer/payment/BuyerPaymentQuickbooks';
import BuyerPaymentStripe from 'client/portal/buyer/payment/BuyerPaymentStripe';
import PhotogError, { PhotogErrorType } from 'common/PhotogError';
import dayjs from 'dayjs';
import * as React from 'react';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import { useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import ErrorMessage from 'shared/components/ErrorMessage';
import OrderRuleContext from 'shared/components/fields/OrderRuleContext';
import Button from 'shared/components/tailwind/Button';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import {
  BuyerCreateOrderScheduleDocument,
  BuyerJobAcceptDocument,
  BuyerOrderRuleContextDocument,
  BuyerOrderViewDocument,
  JobStatus,
  OrderStatus,
  PaymentSourceType,
  Permission,
  VendorInvoiceChargePaymentDocument,
  VendorOrderConfirmDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import AcceptIcon from 'shared/icons/AcceptIcon';
import AddIcon from 'shared/icons/AddIcon';
import { useHasPermission } from 'shared/UserState';
import Money, { useMoney } from 'shared/utilities/Money';
import { BuyerCreateOrderRequested } from './order/BuyerCreateOrderState';
import BuyerOrderTimePreferencesPicker from './order/BuyerOrderTimePreferencesPicker';

export default function BuyerOrderView() {
  const { buyerId, orderId } = useParams();
  const money = useMoney();
  const vendorId = useCurrentVendorId();

  const crit = { orderId, vendorId };

  const { order, vendor } = useQueryHook(BuyerOrderViewDocument, crit, 'cache-and-network');
  const buyer = order.buyer;
  const refresh = useQueryPromise(BuyerOrderViewDocument);

  const vendorMemberId = useCurrentVendorId();
  const hasPermission = useHasPermission();

  const vendorOrderScheduleConfig = useQueryHook(BuyerCreateOrderScheduleDocument, { vendorMemberId });

  const { order: orderRule } = useQueryHook(BuyerOrderRuleContextDocument, { orderId }, 'cache-and-network');
  const requested = useState<BuyerCreateOrderRequested[]>(
    buyer.lastOrder?.requested ? (buyer.lastOrder?.requested as BuyerCreateOrderRequested[]) : []
  );

  const specific = useState(requested.length > 0 || vendorOrderScheduleConfig.vendor.requireRequestTimes);

  const context = OrderRuleContext(orderRule);

  const accept = useMutationPromise(BuyerJobAcceptDocument);
  const charge = useMutationPromise(VendorInvoiceChargePaymentDocument);
  const confirm = useMutationPromise(VendorOrderConfirmDocument);

  const location = useQueryParams();

  const deliveryJobs = order.jobs.filter((j) => j.buyerDeliverables.length > 0);

  const isTimePreferenceError = vendorOrderScheduleConfig.vendor.requireRequestTimes && requested.length === 0;

  const local = useState({
    payment: false,
    paymentSuccessful: false,
    failed: null as PhotogError<PhotogErrorType>,
    error: false,
    sources: !vendor.paymentType ? [] : buyer.sources.filter((s) => s.primary).map((s) => s.id),
  });

  const canPay =
    !location.created &&
    +order.unpaidBalance > 0 &&
    (order.status === OrderStatus.BuyerAccepted || order.status === OrderStatus.Completed);

  const jobs = order.jobs.filter((j) => j.performable?.__typename === 'Service');

  const pay = async () => {
    local.merge({
      failed: null,
      error: false,
    });

    try {
      await charge({
        invoiceId: order.invoice.id,
        paymentSourceIds: local.sources.get(),
        data: { amount: order.unpaidBalance },
      });
    } catch (ex) {
      if (PhotogError.isType(ex, PhotogErrorType.CARD_AUTHORIZE_FAILED)) {
        local.merge({ failed: ex });

        return;
      }

      local.merge({ error: true });

      return;
    }
    await refresh(crit);
    local.paymentSuccessful.set(true);
  };

  return (
    <AddressLayout address={order.address}>
      {order.quote && (
        <>
          <Message
            type={isTimePreferenceError ? MessageType.ERROR : MessageType.WARNING}
            title="Order Unconfirmed"
            className="mb shadow"
            round
            actions={
              !isTimePreferenceError && [
                {
                  icon: <AcceptIcon />,
                  label: 'Confirm Order',
                  async onClick() {
                    await confirm({ orderId: order.id, requestedInput: { requested: requested.get() } });
                  },
                },
              ]
            }
          >
            {isTimePreferenceError
              ? 'Please provide at least one date/time before confirming your order.'
              : 'Please review the following order and confirm when you are ready.'}
          </Message>
          <div className="text-lg font-semibold mt">Appointment Preferences</div>
          <div className="space-y mb">
            <BuyerOrderTimePreferencesPicker
              specific={specific}
              query={vendorOrderScheduleConfig}
              requested={requested}
              orderRuleContext={context}
            />
          </div>
        </>
      )}
      {location.created && (
        <Message type={MessageType.SUCCESS} title="Order Submitted" className="mb shadow" round>
          Thank you for submitting your order, we will follow up with you soon!
        </Message>
      )}
      {local.paymentSuccessful.get() && (
        <Message type={MessageType.SUCCESS} title="Payment Successful" className="mt mb shadow" round>
          Payment against this order received!
        </Message>
      )}
      {canPay && (
        <Card className="mb">
          <Modal show={local.payment}>
            <div className="w-full max-w-xl px">
              {vendor.paymentType === PaymentSourceType.Stripe && (
                <BuyerPaymentStripe
                  buyerRelId={buyerId}
                  isDefault={buyer.sources.length === 0}
                  onSave={(id: string) => {
                    refresh(crit)
                      .then(() => {
                        local.payment.set(false);
                        local.sources.set((l) => [...(l || []), id]);
                      })
                      .catch(captureException);
                  }}
                />
              )}
              {vendor.paymentType === PaymentSourceType.Quickbooks && (
                <BuyerPaymentQuickbooks
                  buyerRelId={buyerId}
                  isDefault={buyer.sources.length === 0}
                  test={vendor.paymentTest}
                  onSave={(id: string) => {
                    refresh(crit)
                      .then(() => {
                        local.payment.set(false);
                        local.sources.set((l) => [...(l || []), id]);
                      })
                      .catch(captureException);
                  }}
                />
              )}
            </div>
          </Modal>
          <div className="space-y">
            {!!vendor.paymentType && (
              <>
                <div className="text-xl font-semibold">Balance Owed: {money(order.unpaidBalance)}</div>
                <p className="text-content">
                  Please select at least one payment option to continue. If more than one payment method is selected, we
                  will split the payment evenly across each method.
                </p>
                {buyer.sources.length > 0 && !local.sources.length && (
                  <Message type={MessageType.ERROR} title="Payment Required" round>
                    Please choose at least one payment method to continue.
                  </Message>
                )}

                <Table round border>
                  <TableHead>
                    <TableRow>
                      <TableHeadCell>Name</TableHeadCell>
                      <TableHeadCell>Account</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {buyer.sources
                      .sort((a, b) => {
                        if (a.primary && !b.primary) {
                          return -1;
                        }

                        if (!a.primary && b.primary) {
                          return 1;
                        }

                        return a.name.localeCompare(b.name);
                      })
                      .map((source) => (
                        <TableRow key={source.id}>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <FormArrayCheckbox state={local.sources} value={source.id} />
                              <div className="whitespace-nowrap">{source.name}</div>
                            </div>
                          </TableCell>
                          <TableCell className="w-full">
                            <div className="flex items-center">
                              <div className="w-8">
                                <CreditCardBrand brand={source.brand} />
                              </div>
                              <div className="ml-1">{source.last4}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Link
                          onClick={() => {
                            local.payment.set(true);
                          }}
                          style={LinkStyle.BOLD}
                          icon={<AddIcon />}
                        >
                          Add New Payment Method
                        </Link>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </>
            )}

            {local.sources.length > 0 && (
              <>
                {local.failed.get() && <ErrorMessage error={local.failed.get()} round />}
                <PromiseButton onClick={pay} large disabled={jobs.length === 0} snackbar={false}>
                  Pay {money(order.unpaidBalance)}
                </PromiseButton>
              </>
            )}
          </div>
        </Card>
      )}
      <Card>
        <DescriptionColumns>
          <DescriptionColumnsItem name="Address">
            {order.address.addressFirst} <br />
            {order.address.addressSecond}
          </DescriptionColumnsItem>

          {order.metadata.map((p) => (
            <DescriptionColumnsItem name={p.title} key={p.propertyId}>
              {p.display}
            </DescriptionColumnsItem>
          ))}

          {order.requested.length > 0 && (
            <DescriptionColumnsItem name="Requested Times">
              {order.requested.map((r) => (
                <Requested start={r.start} end={r.end} key={`${r.start}${r.end}`} />
              ))}
            </DescriptionColumnsItem>
          )}
        </DescriptionColumns>

        <div className="text-xl font-semibold mt mb">Services & Charges</div>

        <OrderServiceAndCostTable orderInvoiceLines={order.orderInvoiceLines} revenue={order.revenue} permissions />

        {hasPermission(Permission.BuyerCost) && order.invoice.payments.length > 0 && (
          <>
            <div className="text-xl font-semibold mt">Payments</div>

            <Table round border className="mt">
              <TableHead>
                <TableRow>
                  <TableHeadCell>Date</TableHeadCell>
                  <TableHeadCell>Payment Method</TableHeadCell>
                  <TableHeadCell>Amount</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order.invoice.payments.map((payment) => {
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>{dayjs(payment.created).format('MM-DD-YYYY')}</TableCell>
                      <TableCell>
                        {payment.source ? (
                          <div className="flex items-center">
                            <div className="w-8">
                              <CreditCardBrand brand={payment.source.brand} />
                            </div>
                            <div className="ml-1">
                              {payment.source.name} ({payment.source.last4})
                            </div>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>

                      <TableCell>
                        <Money>{payment.authorized || payment.captured}</Money>
                        {!payment.captured && '(HOLD)'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </>
        )}
      </Card>
      {deliveryJobs.length > 0 && (
        <div className="space-y-6 mt-6">
          {deliveryJobs.map((job) => (
            <Card
              className="mt"
              key={job.id}
              title={`${job.root.performable.marketing.name} (${job.buyerDeliverables.length})`}
            >
              <div className="flex items-center space-x">
                {job.buyerCanDownload ? (
                  <Button
                    onClick={() => {
                      window.open(`/api/buyer/${buyerId}/order/${order.id}/job/${job.id}/download`);
                    }}
                  >
                    Download
                  </Button>
                ) : (
                  <PromiseButton
                    snackbar={false}
                    onClick={async () => {
                      await accept({ jobId: job.id });
                    }}
                  >
                    Pay to Download: {money(job.revenue)}
                  </PromiseButton>
                )}

                {job.buyerDeliverables.every((d) => d.__typename === 'DeliverableImage') && (
                  <Link to={`/public/gallery/${job.id}`} open>
                    Sharable Public Link
                  </Link>
                )}
              </div>

              {job.buyerDeliverables.every((d) => d.__typename === 'DeliverableImage') ? (
                <div className="mt">
                  <ImageGallery
                    items={job.buyerDeliverables.map((d) => {
                      if (d.__typename !== 'DeliverableImage') {
                        return;
                      }

                      let replace = d.s3.replace('photog-upload.s3.us-east-1.amazonaws.com', 'photog.imgix.net');
                      replace = replace.replace('photog-upload.s3.amazonaws.com', 'photog.imgix.net');
                      replace = replace.replace('photog-upload.s3-accelerate.amazonaws.com', 'photog.imgix.net');
                      replace = replace.replace('photog-test.s3.us-east-1.amazonaws.com', 'photog-test.imgix.net');
                      replace = replace.replace('photog-test.s3-accelerate.amazonaws.com', 'photog-test.imgix.net');

                      if (replace.includes('/private') && replace.includes('photog.imgix.net')) {
                        replace = replace.replace('photog.imgix.net', 'photog-private.imgix.net');
                      }

                      return {
                        original: `${replace}?auto=format,compress&fit=crop&q=70&w=2000`,
                        thumbnail: `${replace}?auto=format,compress&fit=crop&q=10&w=512`,
                      };
                    })}
                  />
                </div>
              ) : (
                <>
                  {job.buyerDeliverables
                    .filter(
                      (deliverable) =>
                        deliverable.__typename === 'DeliverableLink' ||
                        deliverable.__typename === 'DeliverableMatterport'
                    )
                    .map((deliverable) => (
                      <DeliverablePreview deliverable={deliverable} key={deliverable.id} />
                    ))}
                  <div className="grid gap-4 grid-cols-2 md:grid-cols-3 mt">
                    {job.buyerDeliverables
                      .filter(
                        (deliverable) =>
                          deliverable.__typename !== 'DeliverableLink' &&
                          deliverable.__typename !== 'DeliverableMatterport'
                      )
                      .map((deliverable) => (
                        <DeliverablePreview
                          deliverable={deliverable}
                          key={deliverable.id}
                          preview={job.status !== JobStatus.Completed}
                        />
                      ))}
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </AddressLayout>
  );
}
