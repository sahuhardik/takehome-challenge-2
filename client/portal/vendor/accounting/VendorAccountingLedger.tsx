import { State, useState } from '@hookstate/core';
import Center from 'client/global/components/tailwind/Center';
import Link from 'client/global/components/tailwind/Link';
import PaginatorQuery from 'client/global/components/tailwind/PaginatorQuery';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableProps,
  TableRow,
} from 'client/global/components/tailwind/Table';
import dayjs from 'dayjs';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { VendorLedgerDocument, VendorLedgerQuery } from 'shared/generated';
import Money from 'shared/utilities/Money';

function LedgerTable({
  state,
  ...props
}: { state: State<VendorLedgerQuery['vendor']['ledger']['objects']>; order?: React.ReactNode } & Omit<
  TableProps,
  'children'
>) {
  const items = useState(state).get();
  const { vendorId } = useParams();

  return (
    <Table {...props}>
      <TableHead>
        <TableRow>
          <TableHeadCell>Ledger ID</TableHeadCell>
          <TableHeadCell>Ledger Date</TableHeadCell>
          <TableHeadCell>Schedule Date</TableHeadCell>
          <TableHeadCell>Amount</TableHeadCell>
          <TableHeadCell>Source</TableHeadCell>
          <TableHeadCell>Company</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>#{entry.id}</TableCell>
            <TableCell>{dayjs(entry.date).format('MM/DD h:mm A')}</TableCell>
            <TableCell>{entry.job && dayjs(entry.job.start).format('MM/DD h:mm A')}</TableCell>
            <TableCell>
              <Money>{entry.amount}</Money>
            </TableCell>
            <TableCell>
              {entry.job && (
                <Link to={`/ui/vendor/${vendorId}/order/view/${entry.job.orderId}/jobs/${entry.job.id}`}>
                  #{entry.job.id}
                </Link>
              )}
            </TableCell>
            <TableCell>{entry.job?.assignee?.company}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function VendorAccountingLedger() {
  const { vendorId } = useParams();

  const ledgers = useState<VendorLedgerQuery>({ vendor: { id: vendorId, ledger: { total: 0, objects: [] } } });

  return (
    <Center>
      <LedgerTable state={ledgers.vendor.ledger.objects} />

      <PaginatorQuery
        query={VendorLedgerDocument}
        variables={{ vendorId }}
        total={ledgers.vendor.ledger.total}
        onData={ledgers.set}
      ></PaginatorQuery>
    </Center>
  );
}
