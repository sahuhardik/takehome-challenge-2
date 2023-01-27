import Card from 'client/global/components/tailwind/Card';
import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import useGetCurrentBuyerRelId from 'client/global/hooks/useCurrentBuyer';
import { BuyerContent } from 'client/portal/buyer/BuyerLayout';
import BuyerPaymentMethods from 'client/portal/buyer/payment/BuyerPaymentMethods';
import * as React from 'react';
import Button from 'shared/components/tailwind/Button';
import { BuyerInvoicesDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import { tz } from 'shared/state/TimezoneState';
import Money from 'shared/utilities/Money';

export default function BuyerPayment() {
  const buyerRelId = useGetCurrentBuyerRelId();

  const invoices = useQueryHook(BuyerInvoicesDocument, { buyerRelId });

  let content = <Card title="Invoices">There are no invoices on file.</Card>;

  if (invoices.buyer.invoices.length > 0) {
    content = (
      <Card title="Invoices">
        <Button
          onClick={() => {
            window.open(`/api/buyer/${buyerRelId}/invoices/download`);
          }}
        >
          Download All
        </Button>
        <Table round border className="mt-6">
          <TableHead>
            <TableRow>
              <TableHeadCell>#</TableHeadCell>
              <TableHeadCell>Date</TableHeadCell>
              <TableHeadCell>Amount</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell></TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.buyer.invoices.map((i) => (
              <TableRow key={i.id}>
                <TableCell>{i.number}</TableCell>
                <TableCell>{tz(i.due).format('MM-DD-YYYY')}</TableCell>
                <TableCell>
                  <Money>{i.amount}</Money>
                </TableCell>
                <TableCell>{i.status}</TableCell>
                <TableCell>
                  {i.pdf ? (
                    <Link to={i.pdf} style={LinkStyle.BOLD}>
                      Download PDF
                    </Link>
                  ) : (
                    'Download Unavailable'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  }

  return (
    <BuyerContent padding className="space-y">
      <BuyerPaymentMethods />

      {content}
    </BuyerContent>
  );
}
