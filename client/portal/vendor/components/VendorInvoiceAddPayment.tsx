import { useState } from '@hookstate/core';
import { captureException } from '@sentry/react';
import { SlidebarCloseButton } from 'client/global/components/button/SlidebarOpenButton';
import CreditCardBrand from 'client/global/components/CreditCardBrand';
import FormArrayCheckbox from 'client/global/components/form/FormArrayCheckbox';
import FormCustomer from 'client/global/components/form/FormCustomer';
import FormMoney from 'client/global/components/form/FormMoney';
import Card from 'client/global/components/tailwind/Card';
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
import useCurrentVendor from 'client/global/hooks/useCurrentVendor';
import { SlidebarContent, SlidebarFooter, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import BuyerPaymentQuickbooks from 'client/portal/buyer/payment/BuyerPaymentQuickbooks';
import BuyerPaymentStripe from 'client/portal/buyer/payment/BuyerPaymentStripe';
import * as React from 'react';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';
import Button from 'shared/components/tailwind/Button';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import {
  ManualInvoicePayment,
  PaymentSourceType,
  VendorAccountingInvoiceDocument,
  VendorInvoiceAddPaymentDocument,
  VendorInvoiceAddPaymentSourceDocument,
  VendorInvoiceAddPaymentSourcesDocument,
  VendorInvoiceChargePaymentDocument,
  VendorInvoiceEditFragment,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import CtrlLeftIcon from 'shared/icons/CtrlLeftIcon';
import { ValidationAttach } from 'shared/utilities/Validation';

function ChooseSource({ buyerId, onSource }: { buyerId: string; onSource: (sourceId: string) => Promise<void> }) {
  const query = useQueryHook(VendorInvoiceAddPaymentSourcesDocument, { buyerId });

  return (
    <Table round border>
      <TableHead>
        <TableRow>
          <TableHeadCell>Name</TableHeadCell>
          <TableHeadCell>Account</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {query.buyer.sources.map((source) => (
          <TableRow key={source.id}>
            <TableCell className="w-full">
              <Link onClick={() => onSource(source.id)} style={LinkStyle.BOLD} icon={<AddIcon />}>
                {source.name}
              </Link>
            </TableCell>
            <TableCell>
              <div className="flex items-center">
                <div className="w-8">
                  <CreditCardBrand brand={source.brand} />
                </div>
                <div className="ml-1">{source.last4}</div>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AddExisting({ buyerId, onSource }: { buyerId: string; onSource: (sourceId: string) => Promise<any> }) {
  const local = useState({
    buyerId: null as string,
    search: false,
  });

  ValidationAttach(local);

  if (local.search.get()) {
    return (
      <div className="w-full max-w-xl">
        <Card>
          <FormCustomer onSelect={(id) => local.buyerId.set(id)} />

          {local.buyerId.get() && (
            <div className="mt">
              <ChooseSource onSource={onSource} buyerId={local.buyerId.get()} />
            </div>
          )}

          <Button icon={<CtrlLeftIcon />} right={false} onClick={() => local.search.set(false)} className="mt">
            Go back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl">
      <Card>
        <ChooseSource onSource={onSource} buyerId={buyerId} />
        <Link onClick={() => local.search.set(true)} className="mt">
          Use Another Customer&apos;s Payment Method
        </Link>
      </Card>
    </div>
  );
}

export default function VendorInvoiceAddPayment({
  invoice,
  onAdd,
}: {
  invoice: VendorInvoiceEditFragment;
  onAdd: () => Promise<void>;
}) {
  const { vendor } = useCurrentVendor();
  const save = useMutationPromise(VendorInvoiceAddPaymentDocument);
  const refresh = useQueryPromise(VendorAccountingInvoiceDocument);
  const attach = useMutationPromise(VendorInvoiceAddPaymentSourceDocument);
  const charge = useMutationPromise(VendorInvoiceChargePaymentDocument);

  const state = useState({
    amount: '0',
    payment: {
      amount: '0',
    } as ManualInvoicePayment,
    sourceIds: invoice.sources.map((s) => s.source.id),
    showPayment: false,
    showExisting: false,
  });

  ValidationAttach(state, (validator) => {
    validator.payment.amount.required();

    // cash can be positive or negative
    validator
      .when((s) => s.sourceIds.length === 0)
      .payment.amount.validate(
        (amount) => Math.abs(parseFloat(amount)) > 0,
        'Please provide a number other than zero.'
      );

    // credit card amount must be positive
    validator
      .when((s) => s.sourceIds.length > 0)
      .payment.amount.validate(
        (amount) => parseFloat(amount) > 0,
        'You can only charge a card with a positive amount.'
      );
  });

  const onSourceSave = (sourceId: string) =>
    attach({ invoiceId: invoice.id, sourceId })
      .then(() =>
        refresh({ invoiceId: invoice.id }).then(() => {
          state.merge((s) => ({
            showPayment: false,
            showExisting: false,
            sourceIds: [...(s.sourceIds || []), sourceId],
          }));
        })
      )
      .catch(captureException);

  return (
    <>
      <SlidebarHeader title="Add Payment" />
      <SlidebarContent>
        {!!vendor.paymentType && (
          <>
            <Modal show={state.showPayment}>
              <div className="w-full max-w-xl px">
                {vendor.paymentType === PaymentSourceType.Stripe && (
                  <BuyerPaymentStripe
                    isDefault={invoice.sources.length === 0}
                    onSave={onSourceSave}
                    showDefault={false}
                    buyerRelId={invoice.payerRelId}
                  />
                )}
                {vendor.paymentType === PaymentSourceType.Quickbooks && (
                  <BuyerPaymentQuickbooks
                    isDefault={invoice.sources.length === 0}
                    showDefault={false}
                    buyerRelId={invoice.payerRelId}
                    test={vendor.paymentTest}
                    onSave={onSourceSave}
                  />
                )}
              </div>
            </Modal>
            <Modal show={state.showExisting}>
              <AddExisting buyerId={invoice.buyer.id} onSource={onSourceSave} />
            </Modal>
            <div className="space-y">
              {state.sourceIds.length === 0 && (
                <Message type={MessageType.WARNING} title="Cash Payment">
                  Since no payment methods were selected this will be added as a cash payment.
                </Message>
              )}

              <Table round border>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Name</TableHeadCell>
                    <TableHeadCell>Account</TableHeadCell>
                    <TableHeadCell>Customer</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.sources
                    .sort((a, b) => {
                      if (a.source.primary && !b.source.primary) {
                        return -1;
                      }

                      if (!a.source.primary && b.source.primary) {
                        return 1;
                      }

                      return a.source.name.localeCompare(b.source.name);
                    })
                    .map(({ source, buyer }) => (
                      <TableRow key={source.id}>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <FormArrayCheckbox state={state.sourceIds} value={source.id} />
                            <div className="whitespace-nowrap">{source.name}</div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8">
                              <CreditCardBrand brand={source.brand} />
                            </div>
                            <div className="ml-1">{source.last4}</div>
                          </div>
                        </TableCell>
                        <TableCell className="w-full">{buyer.member.company}</TableCell>
                      </TableRow>
                    ))}
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Link
                        onClick={() => {
                          state.showPayment.set(true);
                        }}
                        style={LinkStyle.BOLD}
                        icon={<AddIcon />}
                      >
                        Add New Payment Method
                      </Link>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Link
                        onClick={() => {
                          state.showExisting.set(true);
                        }}
                        style={LinkStyle.BOLD}
                        icon={<AddIcon />}
                      >
                        Add Existing Payment Method
                      </Link>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </>
        )}
        <FormGroup className="mt">
          {+state.payment.amount.get() < 0 && (
            <Message type={MessageType.WARNING} round title="Negative Payment">
              By adding a negative amount, you acknowledge that money was returned outside of the system (eg: via bank
              or manually through a payment processor). Do not use this for making adjustments to the invoice (eg:
              discounts, credits, etc).
            </Message>
          )}
          <FormHorizontal state={state.payment.amount} name="Amount">
            <FormMoney state={state.payment.amount} />
          </FormHorizontal>
          <FormHorizontal state={state.payment.notes} name="Notes">
            <FormText state={state.payment.notes} lines={3} />
          </FormHorizontal>
        </FormGroup>
      </SlidebarContent>
      <SlidebarFooter>
        <SlidebarCloseButton
          className="w-full"
          disabled={state.payment}
          onClick={async () => {
            if (state.sourceIds.length) {
              await charge({
                invoiceId: invoice.id,
                paymentSourceIds: state.sourceIds.get(),
                data: state.payment.get(),
              });
            } else {
              await save({ invoiceId: invoice.id, data: state.payment.get() });
            }

            await refresh({ invoiceId: invoice.id });

            if (onAdd) {
              await onAdd();
            }
          }}
        >
          {state.sourceIds.length ? 'Charge Payment' : 'Add Cash Payment'}
        </SlidebarCloseButton>
      </SlidebarFooter>
    </>
  );
}
