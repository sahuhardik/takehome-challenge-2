import { TableHeadCell, TableRow } from 'client/global/components/tailwind/Table';
import * as React from 'react';
import { Permission } from 'shared/generated';
import { useHasPermission } from 'shared/UserState';

export enum BuyerOrdersTableColumns {
  Status = 'Status',
  Address = 'Address',
  Date = 'Date',
  Total = 'Total',
}

export const allColumns = Object.values(BuyerOrdersTableColumns);

export interface BuyerOrdersTableHeadProps {
  columns?: BuyerOrdersTableColumns[];
}

export default function BuyerOrdersTableHead({ columns = allColumns }: BuyerOrdersTableHeadProps) {
  const hasPermission = useHasPermission();

  const columnSet = new Set(columns || []);
  return (
    <TableRow>
      {columnSet.has(BuyerOrdersTableColumns.Status) && <TableHeadCell>Status</TableHeadCell>}
      {columnSet.has(BuyerOrdersTableColumns.Address) && <TableHeadCell>Address</TableHeadCell>}
      {columnSet.has(BuyerOrdersTableColumns.Date) && <TableHeadCell>Date</TableHeadCell>}
      {hasPermission(Permission.BuyerCost) && columnSet.has(BuyerOrdersTableColumns.Total) && (
        <TableHeadCell>Total</TableHeadCell>
      )}
    </TableRow>
  );
}
