import { useState } from '@hookstate/core';
import ErrorRoute from 'client/global/components/ErrorRoute';
import Center from 'client/global/components/tailwind/Center';
import SelectGrid from 'client/global/components/tailwind/SelectGrid';
import SpinnerLoader from 'client/global/components/tailwind/SpinnerLoader';
import VendorCustomerForm from 'client/portal/vendor/customers/VendorCustomerForm';
import VendorCustomersImport from 'client/portal/vendor/customers/VendorCustomersImport';
import VendorCustomersList from 'client/portal/vendor/customers/VendorCustomersList';
import { CustomerCreateValidation, toBuyerWrite } from 'client/portal/vendor/customers/VendorCustomerUtil';
import * as React from 'react';
import { Route, Routes, useParams } from 'react-router-dom';
import {
  BuyerWrite,
  FieldRole,
  MemberType,
  UserWrite,
  VendorBuyerUpdateDocument,
  VendorCustomerCreateDocument,
  VendorCustomerDefaultRolesDocument,
  VendorCustomerGetDocument,
  VendorFieldsDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import CustomersIcon from 'shared/icons/CustomersIcon';
import UsersIcon from 'shared/icons/UsersIcon';

function VendorCustomerCreate() {
  const { vendorId } = useParams();

  const fields = useQueryHook(VendorFieldsDocument, { vendorId }, 'cache-and-network');
  const query = useQueryHook(VendorCustomerDefaultRolesDocument, { vendorId }, 'cache-and-network');

  const initial: Partial<BuyerWrite> = {
    users: [],
    performables: [],
    properties: fields.vendor.fields
      .filter((f) => f.role === FieldRole.Buyer)
      .map((f) => ({
        fieldId: f.id,
      })),
    blockedProviders: [],
    postPay: query.vendor.payLaterDefault,
  };

  const state = useState(initial as BuyerWrite);

  CustomerCreateValidation(
    state,
    fields.vendor.fields.filter((f) => f.role === FieldRole.Buyer),
    query.vendor.defaultRoles
  );

  const create = useMutationPromise(VendorCustomerCreateDocument);

  if (!state.type.get()) {
    return (
      <Center padding small>
        <SelectGrid
          items={[
            {
              icon: <UsersIcon />,
              title: 'Person',
              description:
                'Choose this option if an individual is the responsible financial party (additional users may still be added to the account).',
              onClick: () => state.merge({ type: MemberType.Person, person: {} as unknown as UserWrite }),
            },
            {
              icon: <CustomersIcon />,
              title: 'Organization',
              description: 'Otherwise, if you plan on billing the customer as a business, choose this option.',
              onClick: () => state.type.set(MemberType.Organization),
            },
          ]}
        />
      </Center>
    );
  }

  return (
    <Center padding small>
      <VendorCustomerForm
        title="Create Customer"
        state={state}
        mutation={async (data, sendEmail) => {
          await create({ data, vendorId, sendEmail });
        }}
      />
    </Center>
  );
}

function VendorCustomerEdit() {
  const { customerId, vendorId } = useParams();

  const { buyer: customer } = useQueryHook(VendorCustomerGetDocument, { buyerId: customerId });
  const fields = useQueryHook(VendorFieldsDocument, { vendorId }, 'cache-and-network');
  const query = useQueryHook(VendorCustomerDefaultRolesDocument, { vendorId }, 'cache-and-network');

  const state = useState<BuyerWrite>(toBuyerWrite(customer));

  CustomerCreateValidation(
    state,
    fields.vendor.fields.filter((f) => f.role === FieldRole.Buyer),
    query.vendor.defaultRoles
  );

  const updateBuyer = useMutationPromise(VendorBuyerUpdateDocument);

  return (
    <Center padding small>
      <VendorCustomerForm
        title="Update Customer"
        state={state}
        customer={customer}
        mutation={async (data) => {
          await updateBuyer({ buyerRelId: customerId, data, versionId: customer.versionId });
        }}
      />
    </Center>
  );
}

export default function VendorCustomers() {
  return (
    <Routes>
      <Route
        index
        element={
          <ErrorRoute>
            <SpinnerLoader>
              <VendorCustomersList />
            </SpinnerLoader>
          </ErrorRoute>
        }
      />
      <Route
        path="import/*"
        element={
          <ErrorRoute>
            <SpinnerLoader>
              <VendorCustomersImport />
            </SpinnerLoader>
          </ErrorRoute>
        }
      />
      <Route
        path="create/*"
        element={
          <ErrorRoute>
            <SpinnerLoader>
              <VendorCustomerCreate />
            </SpinnerLoader>
          </ErrorRoute>
        }
      />
      <Route
        path=":customerId/*"
        element={
          <ErrorRoute>
            <SpinnerLoader>
              <VendorCustomerEdit />
            </SpinnerLoader>
          </ErrorRoute>
        }
      />
    </Routes>
  );
}
