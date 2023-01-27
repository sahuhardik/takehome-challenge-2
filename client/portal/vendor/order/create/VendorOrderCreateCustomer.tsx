import { State, useState } from '@hookstate/core';
import { AlgoliaCustomerHit } from 'client/global/Algolia';
import Card from 'client/global/components/tailwind/Card';
import Center from 'client/global/components/tailwind/Center';
import SpinnerLoader from 'client/global/components/tailwind/SpinnerLoader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import SearchToolbar, { HitRenderProps } from 'client/global/layout/SearchToolbar';
import { VendorCustomerContactForm } from 'client/portal/vendor/customers/VendorCustomerContactForm';
import * as React from 'react';
import { Highlight } from 'react-instantsearch-dom';
import { useNavigate, useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import Config from 'shared/Config';
import {
  OrderCreateBuyer,
  VendorOrderCreateBuyerDocument,
  VendorOrderCreateCustomerDocument,
  VendorSaveBuyerContactsDocument,
  VendorSaveOrderContactsDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import CtrlRightIcon from 'shared/icons/CtrlRightIcon';

export function OrderContacts({ buyer, state }: { buyer: { users; contacts }; state: State<OrderCreateBuyer> }) {
  return (
    <Card>
      <div className="text-lg font-medium text-gray-900 gap-y-2 py-2">Contacts</div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeadCell>Customer</TableHeadCell>
            <TableHeadCell />
            <TableHeadCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {buyer.users
            .filter((u) => u.roles.length > 0)
            .map((u) => (
              <TableRow key={u.userId}>
                <TableCell>{u.user.name}</TableCell>
                <TableCell>{u.user.phone}</TableCell>
                <TableCell>{u.user.email}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <VendorCustomerContactForm state={state.contacts} />
    </Card>
  );
}

function SelectedBuyer({ state, orderId }: { state: State<OrderCreateBuyer>; orderId: string }) {
  const query = useQueryHook(VendorOrderCreateBuyerDocument, { buyerId: state.id?.get() }, 'cache-and-network');
  const save = {
    buyer: useMutationPromise(VendorSaveBuyerContactsDocument),
    order: useMutationPromise(VendorSaveOrderContactsDocument),
  };
  const navigate = useNavigate();

  const handleContinue = async () => {
    await save.buyer({
      buyerRelId: state.id.get(),
      contacts: state.contacts.get().filter((c) => c.isDefault),
    });
    if (orderId) {
      await save.order({
        orderId: orderId,
        contacts: state.contacts.get().filter((c) => !c.isDefault),
      });
    }
    navigate('../address');

    return false;
  };

  return (
    <div className="flex flex-col gap-y-4">
      <Card>
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="text-lg font-medium text-gray-900">{query.buyer.member.company}</div>
          <Button
            onClick={() => {
              state.set({ id: null as string, contacts: [] });
              navigate('customer');
            }}
            style={ButtonStyle.QUIET}
          >
            Change Customer
          </Button>
        </div>
      </Card>
      <OrderContacts buyer={query.buyer} state={state} />
      <div className="pt-4 flex flex-row justify-end">
        <PromiseButton onClick={handleContinue} icon={<CtrlRightIcon />}>
          Continue
        </PromiseButton>
      </div>
    </div>
  );
}

function Result({ hit, select }: HitRenderProps<AlgoliaCustomerHit>) {
  const userMatch = hit._highlightResult.users || [];

  return (
    <TableRow>
      <TableCell>
        <Button onClick={() => select()} style={ButtonStyle.QUIET}>
          Select
        </Button>
      </TableCell>
      <TableCell>
        <div className="font-medium text-gray-900">
          <Highlight attribute="name" hit={hit} />
        </div>
        <div className="text-gray-500">
          <Highlight attribute="email" hit={hit} />
        </div>
      </TableCell>
      <TableCell>
        {userMatch.length ? (
          <ul>
            {hit.users.map((user, index) => {
              const match = userMatch[index];

              if (match.email && match.email.matchLevel !== 'none') {
                return (
                  <li key={hit.memberId}>
                    <Highlight attribute={`users[${index}].email`} hit={hit} />
                  </li>
                );
              }

              if (
                (match.first && match.first.matchLevel !== 'none') ||
                (match.last && match.last.matchLevel !== 'none')
              ) {
                return (
                  <li key={hit.memberId}>
                    <Highlight attribute={`users[${index}].first`} hit={hit} />
                    &nbsp;
                    <Highlight attribute={`users[${index}].last`} hit={hit} />
                  </li>
                );
              }
            })}
          </ul>
        ) : null}
      </TableCell>
    </TableRow>
  );
}

export function VendorOrderCreateCustomer({ state, orderId }: { state: State<OrderCreateBuyer>; orderId: string }) {
  const { vendorId } = useParams();
  const { vendor } = useQueryHook(VendorOrderCreateCustomerDocument, { vendorId });

  const lookup = useQueryPromise(VendorOrderCreateBuyerDocument);

  const scopedState = useState(state);

  if (scopedState.id.get()) {
    return (
      <Center padding>
        <SpinnerLoader>
          <SelectedBuyer state={state} orderId={orderId} />
        </SpinnerLoader>
      </Center>
    );
  }

  const head = (
    <TableRow>
      <TableHeadCell></TableHeadCell>
      <TableHeadCell className="w-1/2">Name</TableHeadCell>
      <TableHeadCell className="w-1/2">Users</TableHeadCell>
    </TableRow>
  );

  return (
    <Center padding>
      <SearchToolbar
        api={vendor.algolia}
        index={Config.SEARCH_INDEX_BUYER}
        head={head}
        hit={Result}
        placeholder="search by customer name or email"
        onSelect={async (hit) => {
          const { buyer } = await lookup({ buyerId: hit.objectID });

          state.merge({
            id: hit.objectID,
            contacts: buyer.contacts,
          });
        }}
      />
    </Center>
  );
}
