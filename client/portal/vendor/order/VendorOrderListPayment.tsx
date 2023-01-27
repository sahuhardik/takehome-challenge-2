import Center from 'client/global/components/tailwind/Center';
import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import * as React from 'react';
import { VendorOrderListPaymentDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import Money from 'shared/utilities/Money';

export default function VendorOrderListPayment() {
  const vendorId = useCurrentVendorId();

  const query = useQueryHook(VendorOrderListPaymentDocument, { vendorId });
  const total = query.vendor.orders.reduce((prev, cur) => parseFloat(cur.revenue) + prev, 0);

  return (
    <Center padding>
      <div className="mb text-xl">
        <strong>Total Outstanding</strong>: <Money>{total}</Money>
      </div>
      <Table card round border>
        <TableHead>
          <TableRow>
            <TableHeadCell>ID</TableHeadCell>
            <TableHeadCell>Amount</TableHeadCell>
            <TableHeadCell>Invoice</TableHeadCell>
            <TableHeadCell className="flex-1">Address</TableHeadCell>
            <TableHeadCell className="flex-1">Customer</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {query.vendor.orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>#{order.id}</TableCell>
              <TableCell>
                <Money>{order.revenue}</Money>
              </TableCell>
              <TableCell>
                <Link style={LinkStyle.BOLD} to={order.invoice.url}>
                  View Invoice {order.invoice.url.includes('qbo') ? '(QB)' : ''}
                </Link>
              </TableCell>
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
