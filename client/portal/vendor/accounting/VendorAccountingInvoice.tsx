import { none, useState } from '@hookstate/core';
import { captureException } from '@sentry/react';
import SlidebarOpenButton, { SlidebarCloseButton } from 'client/global/components/button/SlidebarOpenButton';
import CreditCardBrand from 'client/global/components/CreditCardBrand';
import FormArrayCheckbox from 'client/global/components/form/FormArrayCheckbox';
import FormDateString from 'client/global/components/form/FormDateString';
import FormMoney from 'client/global/components/form/FormMoney';
import Card from 'client/global/components/tailwind/Card';
import Center from 'client/global/components/tailwind/Center';
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
import useCurrentVendor from 'client/global/hooks/useCurrentVendor';
import { SlidebarContent, SlidebarFooter, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import BuyerPaymentQuickbooks from 'client/portal/buyer/payment/BuyerPaymentQuickbooks';
import BuyerPaymentStripe from 'client/portal/buyer/payment/BuyerPaymentStripe';
import dayjs from 'dayjs';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import {
  InvoiceUpdate,
  ManualInvoicePayment,
  PaymentSourceType,
  VendorAccountingInvoiceDocument,
  VendorInvoiceAddPaymentDocument,
  VendorInvoiceAddPaymentSourceDocument,
  VendorInvoiceChargePaymentDocument,
  VendorInvoiceEditFragment,
  VendorUpdateInvoiceDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import DeleteIcon from 'shared/icons/DeleteIcon';
import Money from 'shared/utilities/Money';
import { ValidationAttach } from 'shared/utilities/Validation';
import { v4 } from 'uuid';

function AddPayment({ invoice }: { invoice: VendorInvoiceEditFragment }) {
  const { vendor } = useCurrentVendor();
  const save = useMutationPromise(VendorInvoiceAddPaymentDocument);
  const refresh = useQueryPromise(VendorAccountingInvoiceDocument);
  const attach = useMutationPromise(VendorInvoiceAddPaymentSourceDocument);
  const charge = useMutationPromise(VendorInvoiceChargePaymentDocument);

  const form = useState<ManualInvoicePayment>({
    amount: '0',
  });

  ValidationAttach(form, (validator) => {
    validator.amount.required();
    validator.amount.validate((amount) => Math.abs(parseFloat(amount)) > 0);
  });

  const state = useState({
    sourceIds: invoice.sources.map((s) => s.source.id),
    showPayment: false,
  });

  const onSourceSave = (sourceId: string) =>
    attach({ invoiceId: invoice.id, sourceId })
      .then(() =>
        refresh({ invoiceId: invoice.id }).then(() => {
          state.set((s) => ({
            showPayment: false,
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
                    .map(({ id, source }) => (
                      <TableRow key={id}>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <FormArrayCheckbox state={state.sourceIds} value={source.id} />
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
                          state.showPayment.set(true);
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
            </div>
          </>
        )}
        <FormGroup className="mt">
          <FormHorizontal state={form.amount} name="Amount">
            <FormMoney state={form.amount} />
          </FormHorizontal>
          <FormHorizontal state={form.notes} name="Notes">
            <FormText state={form.notes} lines={3} />
          </FormHorizontal>
        </FormGroup>
      </SlidebarContent>
      <SlidebarFooter>
        <SlidebarCloseButton
          className="w-full"
          disabled={form}
          onClick={async () => {
            if (state.sourceIds.length) {
              await charge({ invoiceId: invoice.id, paymentSourceIds: state.sourceIds.get(), data: form.get() });
            } else {
              await save({ invoiceId: invoice.id, data: form.get() });
            }

            await refresh({ invoiceId: invoice.id });
          }}
        >
          {state.sourceIds.length ? 'Charge Payment' : 'Add Cash Payment'}
        </SlidebarCloseButton>
      </SlidebarFooter>
    </>
  );
}

export default function VendorAccountingInvoice() {
  const { invoiceId } = useParams();
  const update = useMutationPromise(VendorUpdateInvoiceDocument);
  const { invoice } = useQueryHook(VendorAccountingInvoiceDocument, { invoiceId });

  const state = useState<InvoiceUpdate>({
    lines: invoice.lines,
    due: invoice.due,
    date: invoice.date,
  });

  ValidationAttach(state, (v) => {
    v.lines.required();
    v.lines.description.required();
    v.lines.amount.required();
    v.due.required();
    v.date.required();
  });

  const total = state.lines.get().reduce((prev, cur) => prev + parseFloat(cur.amount || '0'), 0);

  return (
    <Center small padding>
      <>
        <div className="text-3xl font-semibold mb">Invoice #{invoice.number}</div>
        <FormGroup>
          <FormHorizontal state={state.due} name="Invoice Date">
            <FormDateString state={state.due} />
          </FormHorizontal>
          <FormHorizontal state={state.date} name="Due Date">
            <FormDateString state={state.date} />
          </FormHorizontal>
        </FormGroup>
        <Table card className="mt">
          <TableHead>
            <TableRow>
              <TableHeadCell>Description</TableHeadCell>
              <TableHeadCell className="w-36">Amount</TableHeadCell>
              <TableHeadCell className="text-right w-36 whitespace-nowrap">
                <Link
                  icon={<AddIcon />}
                  style={LinkStyle.BOLD}
                  onClick={() =>
                    state.lines.merge([
                      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                      { id: v4() } as any,
                    ])
                  }
                >
                  Add Line
                </Link>
              </TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.lines.map((line) => (
              <TableRow key={line.id.get()}>
                <TableCell>
                  <FormText state={line.description} />
                </TableCell>
                <TableCell>
                  <FormMoney state={line.amount} />
                </TableCell>
                <TableCell className="text-center">
                  {state.lines.length > 1 && (
                    <Button slim icon={<DeleteIcon />} style={ButtonStyle.DANGER} onClick={() => line.set(none)} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableCell className="text-right font-semibold">Total</TableCell>
            <TableCell>
              <Money>{total}</Money>
            </TableCell>
            <TableCell></TableCell>
          </TableFooter>
        </Table>
        <PromiseButton
          disabled={state}
          onClick={async () => {
            const data = state.get();

            await update({
              invoiceId,
              data: {
                ...data,
                lines: data.lines.map((l) => ({
                  amount: l.amount,
                  description: l.description,
                  id: l.id.length > 10 ? null : l.id,
                })),
              },
            });

            close();
          }}
        >
          Update
        </PromiseButton>
        <div className="flex justify-between items-center">
          <div className="text-3xl font-semibold mb mt">Payments</div>
          <SlidebarOpenButton style={ButtonStyle.SECONDARY} button="Add Payment">
            <AddPayment invoice={invoice} />
          </SlidebarOpenButton>
        </div>
        {invoice.payments.length ? (
          <Table card round>
            <TableBody>
              {invoice.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell slim className="text-right font-normal">
                    {payment.source?.name || 'Manual Payment'}{' '}
                    <span className="text-quiet text-xs">({dayjs(payment.created).format('MM/DD/YYYY')})</span>
                    {payment.notes && <div className="text-sm text-quiet">{payment.notes}</div>}
                  </TableCell>
                  <TableCell slim className="text-right font-normal">
                    <Money>{payment.captured || payment.authorized}</Money>
                  </TableCell>
                  <TableCell slim />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Card>No payments have been recorded for this invoice.</Card>
        )}
      </>
    </Center>
  );
}
