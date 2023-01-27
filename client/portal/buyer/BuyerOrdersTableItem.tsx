import { AlgoliaOrderHit } from 'client/global/Algolia';
import Link from 'client/global/components/tailwind/Link';
import { TableCell, TableRow } from 'client/global/components/tailwind/Table';
import OrderBadge from 'client/global/components/workflow/OrderBadge';
import { useBuyerAuthUrl } from 'client/global/hooks/useBuyerUrl';
import { BuyerOrdersTableProps } from 'client/portal/buyer/BuyerOrdersTable';
import { allColumns, BuyerOrdersTableColumns } from 'client/portal/buyer/BuyerOrdersTableHead';
import dayjs from 'dayjs';
import * as React from 'react';
import { Hit } from 'react-instantsearch-core';
import { Highlight } from 'react-instantsearch-dom';
import ConfirmationButton from 'shared/components/button/ConfirmationButton';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { BuyerOrderDeleteDocument, OrderSource, OrderStatus, Permission } from 'shared/generated';
import { useMutationPromise } from 'shared/Graph';
import DeleteIcon from 'shared/icons/DeleteIcon';
import { useHasPermission } from 'shared/UserState';
import Money from 'shared/utilities/Money';

type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
  ? ElementType
  : never;

export interface BuyerOrdersTableItemProps {
  order: ArrayElement<BuyerOrdersTableProps['orders']>;
  hit?: Hit<AlgoliaOrderHit>;
  columns?: BuyerOrdersTableColumns[];
}

export default function BuyerOrdersTableItem({ order, hit, columns = allColumns }: BuyerOrdersTableItemProps) {
  const buyerUrl = useBuyerAuthUrl();
  const remove = useMutationPromise(BuyerOrderDeleteDocument);
  const hasPermission = useHasPermission();
  const columnSet = new Set(columns || []);
  return (
    <TableRow key={order.id}>
      {columnSet.has(BuyerOrdersTableColumns.Status) && (
        <TableCell>
          {order.status === OrderStatus.Wizard ? (
            <ConfirmationButton
              title="Delete Order"
              confirmText="Delete"
              icon={<DeleteIcon />}
              description="Are you sure you want to delete this order?"
              onClick={async () => {
                await remove({ orderId: order.id });
              }}
              style={ButtonStyle.DANGER}
            >
              Delete
            </ConfirmationButton>
          ) : (
            <OrderBadge order={order} />
          )}
        </TableCell>
      )}
      {columnSet.has(BuyerOrdersTableColumns.Address) && (
        <TableCell className="w-full">
          <Link
            to={buyerUrl(
              `/orders${order.status === OrderStatus.Wizard && order.source === OrderSource.Buyer ? '/continue' : ''}/${
                order.id
              }${order.status === OrderStatus.Wizard && order.source === OrderSource.Buyer ? '/review' : ''}`
            )}
          >
            <strong>#{order.id}:</strong>{' '}
            {hit ? (
              <>
                <Highlight attribute="address.line1" hit={hit} /> <Highlight attribute="address.line2" hit={hit} />
              </>
            ) : (
              order.address.addressFirst
            )}
          </Link>
        </TableCell>
      )}

      {columnSet.has(BuyerOrdersTableColumns.Date) && (
        <TableCell>{dayjs(order.created).format('MM/DD/YYYY')}</TableCell>
      )}
      {hasPermission(Permission.BuyerCost) && columnSet.has(BuyerOrdersTableColumns.Total) && (
        <TableCell>
          <Money>{order.revenue}</Money>
        </TableCell>
      )}
    </TableRow>
  );
}
