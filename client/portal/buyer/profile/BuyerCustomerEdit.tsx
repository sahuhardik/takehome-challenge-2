import { useState } from '@hookstate/core';
import useGetCurrentBuyerRelId from 'client/global/hooks/useCurrentBuyer';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import { BuyerContent } from 'client/portal/buyer/BuyerLayout';
import BuyerCustomerForm from 'client/portal/buyer/profile/BuyerCustomerForm';
import { BuyerCustomerWriteValidation, toBuyerProfileUpdate } from 'client/portal/buyer/profile/BuyerCustomerUtil';
import * as React from 'react';
import {
  BuyerCustomerGetDocument,
  BuyerProfileUpdate,
  BuyerProfileUpdateDocument,
  BuyerVendorFieldsDocument,
  FieldRole,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';

export default function BuyerCustomerEdit() {
  const buyerRelId = useGetCurrentBuyerRelId();
  const vendorId = useCurrentVendorId();

  const { buyer: customer } = useQueryHook(BuyerCustomerGetDocument, { buyerId: buyerRelId });
  const fields = useQueryHook(BuyerVendorFieldsDocument, { vendorId }, 'cache-and-network');

  const state = useState<BuyerProfileUpdate>(toBuyerProfileUpdate(customer));

  BuyerCustomerWriteValidation(
    state,
    fields.vendor.fields.filter((f) => f.role === FieldRole.Buyer && f.showOnSelfEdit)
  );

  const updateBuyer = useMutationPromise(BuyerProfileUpdateDocument);

  return (
    <BuyerContent padding className="space-y-4">
      <BuyerCustomerForm
        title="Profile"
        state={state}
        mutation={async (data) => {
          await updateBuyer({ buyerRelId, data, versionId: customer.versionId });
        }}
      />
    </BuyerContent>
  );
}
