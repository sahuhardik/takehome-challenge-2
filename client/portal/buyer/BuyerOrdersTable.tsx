import { Table, TableBody, TableHead } from 'client/global/components/tailwind/Table';
import BuyerOrdersTableHead from 'client/portal/buyer/BuyerOrdersTableHead';
import BuyerOrdersTableItem from 'client/portal/buyer/BuyerOrdersTableItem';
import * as React from 'react';
import { BuyerOrdersQuery } from 'shared/generated';

export interface BuyerOrdersTableProps {
  orders: BuyerOrdersQuery['buyer']['filteredOrders'];
}

export default function BuyerOrdersTable({ orders }: BuyerOrdersTableProps) {
  return (
    <Table card>
      <TableHead>
        <BuyerOrdersTableHead />
      </TableHead>
      <TableBody>
        {orders.map((order) => (
          <BuyerOrdersTableItem order={order} key={order.id} />
        ))}
      </TableBody>
    </Table>
  );
}
