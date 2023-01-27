import { useState } from '@hookstate/core';
import { AlgoliaOrderHit } from 'client/global/Algolia';
import DateRangePicker from 'client/global/components/DateRangePicker';
import OrderStatusFilter from 'client/global/components/OrderStatusFilter';
import SpinnerLoader from 'client/global/components/tailwind/SpinnerLoader';
import { useBuyerAuthUrl } from 'client/global/hooks/useBuyerUrl';
import SearchToolbar from 'client/global/layout/SearchToolbar';
import { BuyerContent } from 'client/portal/buyer/BuyerLayout';
import BuyerOrdersTable from 'client/portal/buyer/BuyerOrdersTable';
import BuyerOrdersTableHead, { BuyerOrdersTableColumns } from 'client/portal/buyer/BuyerOrdersTableHead';
import BuyerOrdersTableItem, { BuyerOrdersTableItemProps } from 'client/portal/buyer/BuyerOrdersTableItem';
import { addressFirst } from 'common/util';
import * as React from 'react';
import { Hit } from 'react-instantsearch-core';
import { useNavigate, useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import Config from 'shared/Config';
import { BuyerOrdersDocument, OrderStatus } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import { tz } from 'shared/state/TimezoneState';

function Result({ hit }: { hit: Hit<AlgoliaOrderHit> }) {
  const order: BuyerOrdersTableItemProps['order'] = {
    source: null,
    status: null,
    id: hit.objectID,
    created: new Date(hit.created).toISOString(),
    address: {
      addressFirst: addressFirst(hit.address),
    },
  };
  return (
    <BuyerOrdersTableItem
      order={order}
      hit={hit}
      columns={[BuyerOrdersTableColumns.Address, BuyerOrdersTableColumns.Date]}
    />
  );
}

export default function BuyerOrders() {
  const { buyerId } = useParams();

  const from = useState(tz().subtract(3, 'month').startOf('month').toDate().getTime());
  const to = useState(tz().endOf('day').toDate().getTime());
  const status = useState<OrderStatus[]>([]);

  const query = useQueryHook(
    BuyerOrdersDocument,
    { buyerId, from: new Date(from.get()).toISOString(), to: new Date(to.get()).toISOString(), status: status.get() },
    'cache-and-network'
  );

  React.useEffect(() => {
    if (query.buyer.filteredOrders.length === 0) {
      if (query.buyer.lastOrder) {
        const lastOrder = query.buyer.lastOrder;
        to.set(tz(lastOrder.created).endOf('day').toDate().getTime());
        from.set(tz(lastOrder.created).subtract(3, 'month').startOf('month').toDate().getTime());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useNavigate();
  const buyerUrl = useBuyerAuthUrl();

  return (
    <BuyerContent padding className="space-y-4">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 leading-none">Orders</h1>
        <PromiseButton
          snackbar={false}
          icon={<AddIcon />}
          onClick={() => {
            window.localStorage.removeItem('buyer-order-create');

            navigate(buyerUrl('/orders/create'));
          }}
        >
          Create Order
        </PromiseButton>
      </div>

      <div className="flex items-center space-x-4 flex-wrap">
        <DateRangePicker from={from} to={to} />
        <OrderStatusFilter status={status} />
      </div>
      <SearchToolbar
        api={query.buyer.algolia}
        index={Config.SEARCH_INDEX_ORDER}
        head={<BuyerOrdersTableHead columns={[BuyerOrdersTableColumns.Address, BuyerOrdersTableColumns.Date]} />}
        hit={Result}
        placeholder="search by address"
      >
        <SpinnerLoader>
          <BuyerOrdersTable orders={query.buyer.filteredOrders} />
        </SpinnerLoader>
      </SearchToolbar>
    </BuyerContent>
  );
}
