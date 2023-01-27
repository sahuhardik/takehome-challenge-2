import { useState } from '@hookstate/core';
import { Persistence } from '@hookstate/persistence';
import { AlgoliaOrderHit } from 'client/global/Algolia';
import NavigationButton from 'client/global/components/button/NavigationButton';
import Badge, { BadgeType } from 'client/global/components/tailwind/Badge';
import Center from 'client/global/components/tailwind/Center';
import SpinnerLoader from 'client/global/components/tailwind/SpinnerLoader';
import { TableCell, TableRow } from 'client/global/components/tailwind/Table';
import NestedColumnLayout from 'client/global/layout/NestedColumnLayout';
import SearchToolbar from 'client/global/layout/SearchToolbar';
import VendorOrderStages from 'client/portal/vendor/order/list/VendorOrderStages';
import VendorOrderListCompleted from 'client/portal/vendor/order/VendorOrderListCompleted';
import VendorOrderListPayment from 'client/portal/vendor/order/VendorOrderListPayment';
import * as React from 'react';
import { Hit } from 'react-instantsearch-core';
import { Highlight } from 'react-instantsearch-dom';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import FormSwitch from 'shared/components/form/FormSwitch';
import Config from 'shared/Config';
import { OrderStatus, VendorAccountDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

function Result({ hit }: { hit: Hit<AlgoliaOrderHit> }) {
  const navigate = useNavigate();

  const emailMatch = (b) => b.email && b.email.matchLevel !== 'none';
  const nameMatch = (b) => b.name && b.name.matchLevel !== 'none';

  const buyers = (hit._highlightResult.buyers || []).filter((b) => emailMatch(b) || nameMatch(b));

  const renderCustomer = (index) => {
    if (emailMatch(buyers[index])) {
      return <Highlight attribute={`buyers[${index}].email`} hit={hit} />;
    } else if (nameMatch(buyers[index])) {
      return <Highlight attribute={`buyers[${index}].name`} hit={hit} />;
    }
  };

  let customer = <span>{hit.buyers[0]?.name}</span>;

  if (buyers.length === 1) {
    customer = renderCustomer(0);
  } else if (buyers.length > 1) {
    customer = (
      <ul>
        {buyers.map((b, index) => (
          <li key={`${b.buyerId}`}>{renderCustomer(index)}</li>
        ))}
      </ul>
    );
  }
  const getStatusBadge = (hit: Hit<AlgoliaOrderHit>) => {
    if (hit.status && hit.status.toLocaleUpperCase() === OrderStatus.Canceled) {
      return (
        <div>
          <Badge type={BadgeType.WARNING}>Canceled</Badge>
        </div>
      );
    } else if (hit.hold) {
      return (
        <div>
          <Badge type={BadgeType.NEGATIVE}>On Hold</Badge>
        </div>
      );
    }
  };
  return (
    <TableRow hover onClick={() => navigate(`../view/${hit.objectID}`)}>
      <TableCell>#{hit.objectID}</TableCell>
      <TableCell>
        <Highlight attribute="address.line1" hit={hit} />
        {getStatusBadge(hit)}
      </TableCell>
      <TableCell>{customer}</TableCell>
    </TableRow>
  );
}

export default function VendorOrderList() {
  const { vendorId } = useParams();
  const [searchParams] = useSearchParams();
  const initialSearchValue = searchParams.get('search');

  const {
    vendor: { algolia },
  } = useQueryHook(VendorAccountDocument, { vendorId }, 'cache-first');

  const state = useState({
    days: true,
    asc: true,
  });

  state.attach(Persistence('vendor-order-list'));

  return (
    <NestedColumnLayout
      pages={[
        {
          name: 'Dashboard',
          key: 'dashboard',
          useElement: (
            <Center padding>
              <SearchToolbar
                api={algolia}
                index={Config.SEARCH_INDEX_ORDER}
                initialValue={initialSearchValue}
                head={
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Customer(s)</TableCell>
                  </TableRow>
                }
                hit={Result}
                actions={
                  <div className="flex items-center space-x">
                    <div className="flex items-center space-x-2">
                      <FormSwitch state={state.asc} />
                      <span className="text-sm">{state.asc.get() ? 'Oldest First' : 'Latest First'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FormSwitch state={state.days} />
                      <span className="text-sm">{state.days.get() ? 'Days' : 'Weeks'}</span>
                    </div>
                    <NavigationButton link="../create">Create Order</NavigationButton>
                  </div>
                }
                placeholder="search by address, customer, email or type one of these phrases: hold"
              >
                <SpinnerLoader>
                  <VendorOrderStages asc={state.asc.get()} />
                </SpinnerLoader>
              </SearchToolbar>
            </Center>
          ),
        },
        {
          name: 'Payment',
          key: 'payment',
          useElement: <VendorOrderListPayment />,
        },
        {
          name: 'Completed',
          key: 'completed',
          useElement: <VendorOrderListCompleted />,
        },
      ]}
    />
  );
}
