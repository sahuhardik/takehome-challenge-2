import Center from 'client/global/components/tailwind/Center';
import Link from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import dayjs from 'dayjs';
import * as React from 'react';
import { VendorOrderListCompletedDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

export default function VendorOrderListCompleted() {
  const vendorId = useCurrentVendorId();

  const query = useQueryHook(VendorOrderListCompletedDocument, { vendorId });

  return (
    <Center padding>
      <Table card round border>
        <TableHead>
          <TableRow>
            <TableHeadCell>ID</TableHeadCell>
            <TableHeadCell>Completed</TableHeadCell>
            <TableHeadCell className="flex-1">Address</TableHeadCell>
            <TableHeadCell className="flex-1">Customer</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {query.vendor.orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>#{order.id}</TableCell>
              <TableCell>{dayjs(order.completed).format('MM/DD')}</TableCell>
              <TableCell>
                <Link to={`../view/${order.id}`}>
                  <span className="font-semibold">{order.address.line1}</span>{' '}
                  <span className="text-xs italic">
                    {order.address.city} {order.address.state}
                  </span>
                </Link>
              </TableCell>
              <TableCell>{order.buyer.member.company}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Center>
  );
}
