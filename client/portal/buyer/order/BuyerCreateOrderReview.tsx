import { State, useState } from '@hookstate/core';
import { captureException } from '@sentry/react';
import CreditCardBrand from 'client/global/components/CreditCardBrand';
import OrderFieldsForm from 'client/global/components/fields/OrderFieldsForm';
import FormArrayCheckbox from 'client/global/components/form/FormArrayCheckbox';
import Requested from 'client/global/components/Requested';
import DescriptionColumns, { DescriptionColumnsItem } from 'client/global/components/tailwind/DescriptionColumns';
import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import Modal from 'client/global/components/tailwind/Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { useBlocker } from 'client/global/hooks/useBlocker';
import useGetCurrentBuyerRelId from 'client/global/hooks/useCurrentBuyer';
import { OrderButton, OrderContent, OrderHeading, OrderParagraph, OrderSection } from 'client/portal/buyer/BuyerLayout';
import {
  BuyerCreateOrderState,
  useBuyerOrderCreateStateContext,
} from 'client/portal/buyer/order/BuyerCreateOrderState';
import BuyerPaymentQuickbooks from 'client/portal/buyer/payment/BuyerPaymentQuickbooks';
import BuyerPaymentStripe from 'client/portal/buyer/payment/BuyerPaymentStripe';
import PhotogError, { PhotogErrorType } from 'common/PhotogError';
import { RuleContextAccessor } from 'common/rules/Condition';
import isHtml from 'is-html';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import ErrorMessage from 'shared/components/ErrorMessage';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import {
  BuyerCreateOrderVendorFragment,
  PaymentSourceType,
  ShopCartDocument,
  ShopOrderSubmitDocument,
  ShopRemoveServiceDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import DeleteIcon from 'shared/icons/DeleteIcon';
import EditIcon from 'shared/icons/EditIcon';
import Money, { useMoney } from 'shared/utilities/Money';
import { Validation } from 'shared/utilities/Validation';
import Big from 'big.js';

function Checkout({ state, vendor }: { state: State<BuyerCreateOrderState>; vendor: BuyerCreateOrderVendorFragment }) {
  const allowNavigate = useState(false);

  useBlocker((tx) => {
    const safe = ['/fields', '/configure', '/address', '/schedule', '/additional', 'created=true'];

    if (safe.some((s) => tx.location.pathname.includes(s) || tx.location.search.includes(s))) {
      tx.retry();

      return;
    }

    if (!allowNavigate.get() && confirm('You have not submitted the order, are you sure you want to leave?')) {
      allowNavigate.set(true);

      tx.retry();
    }
  }, !allowNavigate.get());

  const scoped = useState(state);

  const buyerRelId = useGetCurrentBuyerRelId();

  const crit = {
    orderId: scoped.orderId.get(),
    buyerRelId,
  };

  const money = useMoney();

  const { order, buyer } = useQueryHook(ShopCartDocument, crit);

  const refresh = useQueryPromise(ShopCartDocument);

  const remove = useQueryPromise(ShopRemoveServiceDocument);

  const local = useState({
    payment: false,
    failed: null as PhotogError<PhotogErrorType>,
    error: false,
  });

  const navigate = useNavigate();

  const submit = useMutationPromise(ShopOrderSubmitDocument);

  const pay = async () => {
    local.merge({
      failed: null,
      error: false,
    });

    try {
      await submit({ orderId: scoped.orderId.get(), sourceIds: scoped.sources.get() });
    } catch (ex) {
      if (PhotogError.isType(ex, PhotogErrorType.CARD_AUTHORIZE_FAILED)) {
        local.merge({ failed: ex });

        return;
      }

      local.merge({ error: true });

      return;
    }

    navigate(`../../orders/${order.id}?created=true`);
  };

  const additionalChanges: { id: string; amount: string; description: string }[] = order.orderLines.filter((ol) => !ol.jobId && !ol.providerId);

  const seen = {};

  for (const line of order.orderLines) {
    if (line.actionId && !line.expense) {
      if (!seen[line.description]) {
        seen[line.description] = {
          amount: new Big(0),
          jobIds: [],
          entries: 0
        };
      }

      if (line.jobId) {
        seen[line.description].jobIds.push({ id: line.jobId, amount: line.amount });
      }

      seen[line.description].entries += 1;
      seen[line.description].amount = seen[line.description].amount.plus(line.amount);
    }
  }

  for (const [desc, value] of Object.entries(seen)) {
    if (value['entries'] > 1) {
      additionalChanges.push({
        id: desc,
        amount: value['amount'].toFixed(2),
        description: desc
      });
    }
  }

  // hide task steps
  const jobs = order.jobs.filter((j) => j.performable?.__typename === 'Service');

  return (
    <OrderContent>
      <OrderHeading caption="Take a final look" title="Order Review"/>

      <OrderParagraph>
        Please make sure all of the following information is correct before you check out.
      </OrderParagraph>

      <OrderSection name="Order Details" linkUrl="../fields?review=true" linkName="Edit Details">
        <DescriptionColumns>
          <DescriptionColumnsItem name="Address">
            <Link to="../address?review=true" icon={<EditIcon/>}>
              {order.address.addressFirst}
            </Link>
            <br/>
            {order.address.addressSecond}
          </DescriptionColumnsItem>

          {order.metadata.map((p) => (
            <DescriptionColumnsItem name={p.title} key={p.propertyId}>
              {p.display}
            </DescriptionColumnsItem>
          ))}
        </DescriptionColumns>
      </OrderSection>

      <OrderSection name="Appointment Preferences" linkUrl="../schedule?review=true" linkName="Edit Preferences">
        {order.requested.length > 0 ? (
          <>
            <p className="text-content">
              You have indicated you prefer we schedule services within the following dates and times. While will we do
              our best to accommodate, we cannot guarantee availability.
            </p>
            <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 mt text-sm">
              {order.requested.map((r) => (
                <div key={`${r.start}-${r.end}`}>
                  <Requested start={r.start} end={r.end}/>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-content">
            You have not indicated any appointment preferences, therefore we will schedule services around the
            availability of our internal team members.
          </p>
        )}
      </OrderSection>

      <OrderSection name="Services & Charges">
        {jobs.length === 0 && (
          <Message type={MessageType.ERROR} title="No Services Added" round className="mb">
            To continue, you must add at least one service to the order.
          </Message>
        )}
        <Table round border>
          <TableHead>
            <TableRow>
              <TableHeadCell>Description</TableHeadCell>
              <TableHeadCell className="text-right">Cost</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => {
              const config: { id: string; name: string; value: React.ReactNode }[] = [];

              for (const property of job.properties) {
                config.push({
                  id: `p-${property.id}`,
                  name: property.property.marketing.name,
                  value: property.display,
                });
              }

              for (const line of order.orderLines) {
                if (line.jobId === job.id && line.actionId && !line.expense && !additionalChanges.some(a => a.id === line.description)) {
                  config.push({
                    id: `l-${line.id}`,
                    name: line.description,
                    value: <Money>{line.amount}</Money>,
                  });
                }
              }

              let jobRevenue = new Big(job.revenue);

              for (const value of Object.values(seen)) {
                if (value['entries'] > 1) {
                  for (const vjob of value['jobIds']) {
                    if (vjob['id'] === job.id) {
                      jobRevenue = jobRevenue.minus(vjob['amount']);
                    }
                  }
                }
              }

              return (
                <TableRow key={job.id}>
                  <TableCell>
                    {job.packagePerformableId ? (
                      <strong className="text-lg">{job.performable.marketing.name}</strong>
                    ) : (
                      <Link
                        to={`../configure/${job.performable.id}?review=true&jobId=${job.id}&versionId=${job.versionId}`}
                        icon={<EditIcon/>}
                      >
                        <strong className="text-lg">{job.performable.marketing.name}</strong>
                      </Link>
                    )}
                    {config.length > 0 &&
                      config.map(({ id, name, value }) => (
                        <div key={id}>
                          <strong className="text-quiet">{name}</strong>: {value}
                        </div>
                      ))}
                  </TableCell>

                  <TableCell className="text-right">
                    {!job.packagePerformableId && (
                      <PromiseButton
                        snackbar={false}
                        onClick={async () => {
                          await remove({ jobId: job.id });

                          state.services.set((s) => s.filter((s) => s.id !== job.id));

                          await refresh(crit);
                        }}
                        style={ButtonStyle.DANGER}
                        icon={<DeleteIcon/>}
                      >
                        {money(jobRevenue.toFixed(2))}
                      </PromiseButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {additionalChanges.map((charge) => (
              <TableRow key={charge.id}>
                <TableCell>
                  <strong>{charge.description}</strong>
                </TableCell>

                <TableCell>
                  <Money>{charge.amount}</Money>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={2}>
                <Link to="../additional?review=true" style={LinkStyle.BOLD} icon={<AddIcon/>}>
                  Add Another Service
                </Link>
              </TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow color="bg-gray-200">
              <TableCell colSpan={2} className="text-right">
                <div className="pr-4">
                  Total: <Money>{order.revenue}</Money>
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </OrderSection>

      {scoped.terms.get() ? (
        <OrderSection name="Payment">
          <Modal show={local.payment}>
            <div className="w-full max-w-xl px">
              {vendor.paymentType === PaymentSourceType.Stripe && (
                <BuyerPaymentStripe
                  buyerRelId={buyerRelId}
                  isDefault={buyer.sources.length === 0}
                  onSave={(id: string) => {
                    refresh(crit)
                      .then(() => {
                        local.payment.set(false);
                        scoped.sources.set((l) => [...(l || []), id]);
                      })
                      .catch(captureException);
                  }}
                />
              )}
              {vendor.paymentType === PaymentSourceType.Quickbooks && (
                <BuyerPaymentQuickbooks
                  buyerRelId={buyerRelId}
                  isDefault={buyer.sources.length === 0}
                  test={vendor.paymentTest}
                  onSave={(id: string) => {
                    refresh(crit)
                      .then(() => {
                        local.payment.set(false);
                        scoped.sources.set((l) => [...(l || []), id]);
                      })
                      .catch(captureException);
                  }}
                />
              )}
            </div>
          </Modal>
          <div className="space-y">
            {!!vendor.paymentType && !buyer.postPay && (
              <>
                <p className="text-content">
                  Please select at least one payment option to continue. If more than one payment method is selected, we
                  will split the payment evenly across each method.
                </p>
                {buyer.sources.length > 0 && !scoped.sources.length && (
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
                              <FormArrayCheckbox state={scoped.sources} value={source.id}/>
                              <div className="whitespace-nowrap">{source.name}</div>
                            </div>
                          </TableCell>
                          <TableCell className="w-full">
                            <div className="flex items-center">
                              <div className="w-8">
                                <CreditCardBrand brand={source.brand}/>
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
                          icon={<AddIcon/>}
                        >
                          Add New Payment Method
                        </Link>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </>
            )}

            {!vendor.paymentType || buyer.postPay ? (
              <div className="flex items-center space-x">
                <PromiseButton onClick={pay} large disabled={jobs.length === 0} snackbar={false}>
                  Place Order
                </PromiseButton>

                <div className="text-sm text-quiet">
                  By clicking <strong>Place Order</strong> you acknowledge that after the order is completed,{' '}
                  {buyer.netTerms > 0 ? 'we will invoice you' : 'we will charge the credit card on file'} for the full
                  amount indicated (unless any changes to the order or services occurs)
                </div>
              </div>
            ) : (
              scoped.sources.length > 0 && (
                <>
                  {local.failed.get() && <ErrorMessage error={local.failed.get()} round/>}
                  <div className="flex items-center space-x">
                    <PromiseButton onClick={pay} large disabled={jobs.length === 0} snackbar={false}>
                      {buyer.postPay ? 'Authorize' : 'Pay'} {money(order.revenue)}
                    </PromiseButton>

                    <div className="text-sm text-quiet">
                      By clicking <strong>{buyer.postPay ? 'Authorize' : 'Pay'}</strong> you acknowledge that we will
                      place a hold for the full amount (up to 7 days). The charge will process{' '}
                      {buyer.postPay
                        ? 'when the order is completed'
                        : 'after our team has a chance to review and confirm your order'}
                      , otherwise the hold will be released.
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        </OrderSection>
      ) : (
        <OrderSection name="Terms">
          {isHtml(vendor.cartTerms) ? (
            <div className="prose prose-sm max-w-none mb" dangerouslySetInnerHTML={{ __html: vendor.cartTerms }}/>
          ) : (
            <div className="space-y-2 mb">
              {vendor.cartTerms.split('\n').map((p, index) => (
                <p className="text-content" key={`${index}`}>
                  {p}
                </p>
              ))}
            </div>
          )}

          <Button onClick={() => scoped.terms.set(true)} large>
            Agree
          </Button>
        </OrderSection>
      )}
    </OrderContent>
  );
}

export default function BuyerCreateOrderReview({
                                                 state,
                                                 vendor,
                                                 updateOrder,
                                               }: {
  state: State<BuyerCreateOrderState>;
  vendor: BuyerCreateOrderVendorFragment;
  updateOrder: () => Promise<void>;
}) {
  const context = useBuyerOrderCreateStateContext(state);
  const valid = useState(Validation(state.fields).valid(true));

  if (valid.get()) {
    return <Checkout state={state} vendor={vendor}/>;
  }

  return (
    <OrderContent>
      <OrderHeading caption="Before we checkout..." title="Required Information"/>

      <OrderParagraph>
        Based on changes to your order, we require some additional information before you can continue.
      </OrderParagraph>

      <OrderFieldsForm
        state={state.fields}
        vendorId={vendor.id}
        context={new RuleContextAccessor(context)}
        wrapper={OrderSection}
        invalid={true}
      />

      <OrderButton
        disabled={state.fields}
        onButton={async () => {
          await updateOrder();

          valid.set(true);
        }}
        button="Continue"
      />
    </OrderContent>
  );
}
