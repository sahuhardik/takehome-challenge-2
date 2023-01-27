import { none, useState } from '@hookstate/core';
import FormCustomer from 'client/global/components/form/FormCustomer';
import FormDateString from 'client/global/components/form/FormDateString';
import FormMoney from 'client/global/components/form/FormMoney';
import Card from 'client/global/components/tailwind/Card';
import Center from 'client/global/components/tailwind/Center';
import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import dayjs from 'dayjs';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import ConfirmationButton from 'shared/components/button/ConfirmationButton';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  InvoiceCreate,
  InvoiceStatus,
  InvoiceUpdate,
  VendorAccountingInvoicesDocument,
  VendorCreateInvoiceDocument,
  VendorVoidInvoiceDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import DeleteIcon from 'shared/icons/DeleteIcon';
import Money from 'shared/utilities/Money';
import { ValidationAttach } from 'shared/utilities/Validation';
import { v4 } from 'uuid';

function Invoices() {
  const { vendorId } = useParams();
  const query = useQueryHook(VendorAccountingInvoicesDocument, { vendorId });
  const doVoid = useMutationPromise(VendorVoidInvoiceDocument);

  if (!query.invoices.length) {
    return <Card>No invoices are outstanding.</Card>;
  }

  return (
    <Table card>
      <TableHead>
        <TableRow>
          <TableHeadCell>Provider</TableHeadCell>
          <TableHeadCell>Date</TableHeadCell>
          <TableHeadCell>Due</TableHeadCell>
          <TableHeadCell>Amount</TableHeadCell>
          <TableHeadCell></TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {query.invoices
          .filter((i) => i.status !== InvoiceStatus.Voided)
          .map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <Link style={LinkStyle.BOLD} to={`../invoice/${invoice.id}`}>
                  {invoice.buyer.member.company}
                </Link>
              </TableCell>
              <TableCell>{dayjs(invoice.date).format('MM/DD')}</TableCell>
              <TableCell>{dayjs(invoice.due).format('MM/DD')}</TableCell>
              <TableCell>
                <Money>{invoice.amount}</Money>
              </TableCell>
              <TableCell>
                <ConfirmationButton
                  title="Void Invoice"
                  description="Are you sure you want to void the invoice?"
                  confirmText="Yes, void it"
                  onClick={async () => {
                    await doVoid({ invoiceId: invoice.id });
                  }}
                >
                  Void
                </ConfirmationButton>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}

function Create({ close }: { close: () => void }) {
  const { vendorId } = useParams();
  const now = new Date();
  const create = useMutationPromise(VendorCreateInvoiceDocument);
  const refresh = useQueryPromise(VendorAccountingInvoicesDocument);

  const state = useState<
    InvoiceCreate & {
      lines: (InvoiceUpdate['lines'][0] & { id: string })[];
    }
  >({
    lines: [{ amount: '0.00', description: 'Change this description', id: v4() }],
    due: now.toISOString(),
    date: now.toISOString(),
    payerRelId: null as string,
  });

  ValidationAttach(state, (v) => {
    v.lines.required();
    v.lines.description.required();
    v.lines.amount.required();
    v.due.required();
    v.date.required();
    v.payerRelId.required();
  });

  const total = state.lines.get().reduce((prev, cur) => prev + parseFloat(cur.amount || '0'), 0);

  return (
    <Center small>
      <>
        <FormGroup>
          <FormHorizontal state={state.payerRelId} name="Customer">
            <FormCustomer state={state.payerRelId} member={false} />
          </FormHorizontal>
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

            await create({
              invoice: {
                ...data,
                lines: data.lines.map((l) => ({ amount: l.amount, description: l.description })),
              },
            });

            await refresh({ vendorId });

            close();
          }}
        >
          Create
        </PromiseButton>
      </>
    </Center>
  );
}

export default function VendorAccountingInvoices() {
  const state = useState({ create: false, edit: null as string });

  if (state.create.get()) {
    return <Create close={() => state.create.set(false)} />;
  }

  return (
    <Center small>
      <>
        <Button icon={<AddIcon />} onClick={() => state.create.set(true)} className="mb">
          Create Invoice
        </Button>
        <Invoices />
      </>
    </Center>
  );
}
