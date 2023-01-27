import { State, useState } from '@hookstate/core';
import { useRegisterBreadcrumb } from 'client/global/components/BreadcrumbBar';
import Center from 'client/global/components/tailwind/Center';
import VendorSettingsProviderForm from 'client/portal/vendor/settings/provider/VendorSettingProviderForm';
import VendorSettingProviderList from 'client/portal/vendor/settings/provider/VendorSettingProviderList';
import * as React from 'react';
import { Route, Routes, useParams } from 'react-router-dom';
import {
  FieldType,
  ProviderWrite,
  VendorProviderCreateDocument,
  VendorProviderGetDocument,
  VendorProviderRemoveDocument,
  VendorProvidersDocument,
  VendorProviderUpdateDocument,
  VendorSettingsProviderDocument,
  VendorSettingsProviderQuery,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import { ValidationAttach } from 'shared/utilities/Validation';

export function ProviderWriteValidation(state: State<ProviderWrite>, vendor: VendorSettingsProviderQuery['vendor']) {
  ValidationAttach(state, (validator) => {
    validator.color.required();
    validator.company.required();

    // if user array is populated
    validator.users.userId.required();
    validator.users.roleIds.required(); // require at least one role

    // if area array is populated
    validator.areas.zipcode.required();

    validator.performables.performableId.required();

    // require override type if expense is set
    validator.performables.when((p) => !!p.expense.get()).overrideType.required();

    validator.performables.properties.expense.required();
    validator.performables.properties.overrideType.required();
    validator.performables.properties.propertyId.required();

    const requiredPropertyValues = [];

    for (const perf of vendor.performables) {
      for (const prop of perf.properties) {
        if (prop.fieldType === FieldType.Select) {
          requiredPropertyValues.push(prop.id);
        }
      }
    }

    validator.performables.properties
      .when((p) => requiredPropertyValues.includes(p.propertyId.get()))
      .propertyValueId.required();
  });
}

export const defaultBusinessHours = () => [
  { hours: { from: { hour: 0, minute: 0 }, to: { hour: 23, minute: 55 } } },
  { hours: { from: { hour: 0, minute: 0 }, to: { hour: 23, minute: 55 } } },
  { hours: { from: { hour: 0, minute: 0 }, to: { hour: 23, minute: 55 } } },
  { hours: { from: { hour: 0, minute: 0 }, to: { hour: 23, minute: 55 } } },
  { hours: { from: { hour: 0, minute: 0 }, to: { hour: 23, minute: 55 } } },
  { hours: { from: { hour: 0, minute: 0 }, to: { hour: 23, minute: 55 } } },
  { hours: { from: { hour: 0, minute: 0 }, to: { hour: 23, minute: 55 } } },
];

function VendorSettingsProviderCreate() {
  const { vendorId } = useParams();

  const { vendor } = useQueryHook(VendorSettingsProviderDocument, { vendorId }, 'cache-and-network');

  useRegisterBreadcrumb('Create');

  const state = useState({
    color: '#FF0000',
    users: [],
    performables: [],
    areas: [],
    businessHours: null,
  } as ProviderWrite);

  ProviderWriteValidation(state, vendor);

  const create = useMutationPromise(VendorProviderCreateDocument);

  return (
    <Center small>
      <VendorSettingsProviderForm
        title="Create Provider"
        state={state}
        mutation={async (data) => {
          await create({ vendorId, data });
        }}
      />
    </Center>
  );
}

function VendorSettingsProviderEdit() {
  const { providerId, vendorId } = useParams();

  const { vendor } = useQueryHook(VendorSettingsProviderDocument, { vendorId }, 'cache-and-network');

  const { provider } = useQueryHook(VendorProviderGetDocument, { providerId });

  useRegisterBreadcrumb(provider.member.company);

  const state = useState<ProviderWrite>({
    color: provider.color,
    performables: provider.performables.map((p) => ({
      performableId: p.performableId,
      expense: p.expense,
      overrideType: p.overrideType,
      properties: p.properties.map((pp) => ({
        propertyId: pp.propertyId,
        propertyValueId: pp.propertyValueId,
        expense: pp.expense,
        overrideType: pp.overrideType,
      })),
    })),
    areas: provider.areas.map((a) => ({ expense: a.expense, revenue: a.revenue, zipcode: a.zipcode })),
    company: provider.member.company,
    address: provider.member.address,
    users: provider.users.map((u) => ({
      userId: u.userId,
      roleIds: u.roles.map((r) => r.id),
    })),
    businessHours: provider.businessHours ? provider.businessHours : null,
  });

  ProviderWriteValidation(state, vendor);

  const update = useMutationPromise(VendorProviderUpdateDocument);
  const remove = useMutationPromise(VendorProviderRemoveDocument);
  const queryRefresh = useQueryPromise(VendorProvidersDocument);

  return (
    <Center small>
      <VendorSettingsProviderForm
        title="Update Provider"
        state={state}
        provider={provider}
        mutation={async (data) => {
          await update({ providerId, data });
        }}
        remove={async (providerId) => {
          await remove({ providerId });
          await queryRefresh({ vendorId });
        }}
      />
    </Center>
  );
}

export default function VendorSettingProviderRouter() {
  return (
    <Routes>
      <Route path="/" element={<VendorSettingProviderList />} />
      <Route path="/create/*" element={<VendorSettingsProviderCreate />} />
      <Route path="/:providerId/*" element={<VendorSettingsProviderEdit />} />
    </Routes>
  );
}
