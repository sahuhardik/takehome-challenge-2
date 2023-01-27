import { State, useState } from '@hookstate/core';
import FormArrayCheckbox from 'client/global/components/form/FormArrayCheckbox';
import FormRadio from 'client/global/components/form/FormRadio';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { BuyerWrite, VendorCustomerProviderDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

export default function VendorCustomerProvider({ state }: { state: State<BuyerWrite> }) {
  const scoped = useState(state);

  const { customerId, vendorId } = useParams();

  const resp = useQueryHook(VendorCustomerProviderDocument, { buyerId: customerId, vendorId }, 'cache-and-network');

  return (
    <Table card>
      <TableHead>
        <TableRow>
          <TableHeadCell>Provider Name</TableHeadCell>
          <TableHeadCell>Blocked</TableHeadCell>
          <TableHeadCell>Exclusive</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {resp.vendor.providers.map((p) => (
          <TableRow key={p.id}>
            <TableCell>{p.member.company}</TableCell>
            <TableCell>
              <FormArrayCheckbox state={scoped.blockedProviders} value={p.id} />
            </TableCell>
            <TableCell>
              <FormRadio name="exclusive" state={scoped.exclusiveProvider} value={p.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
