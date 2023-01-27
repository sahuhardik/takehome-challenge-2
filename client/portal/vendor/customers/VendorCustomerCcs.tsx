import { useState } from '@hookstate/core';
import * as React from 'react';
import PromiseButton from 'shared/components/button/PromiseButton';
import { OrderCreateBuyer, VendorCustomerCreateBuyerDocument, VendorSaveBuyerContactsDocument } from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import CtrlRightIcon from 'shared/icons/CtrlRightIcon';
import { VendorCustomerContactForm } from './VendorCustomerContactForm';

export default function VendorCustomerCcs({ buyerRelId }: { buyerRelId: string }) {
  const { buyer } = useQueryHook(VendorCustomerCreateBuyerDocument, { buyerId: buyerRelId }, 'cache-and-network');
  const saveCcs = useMutationPromise(VendorSaveBuyerContactsDocument);
  const state = useState<OrderCreateBuyer>(buyer);

  const handleSave = async () => {
    await saveCcs({
      buyerRelId,
      contacts: state.contacts.get(),
    });
  };

  return (
    <div className="bg-white p-4">
      <VendorCustomerContactForm state={state.contacts} isCustomerForm />
      <div className="pt-4 flex flex-row justify-end">
        <PromiseButton onClick={handleSave} icon={<CtrlRightIcon />}>
          Save
        </PromiseButton>
      </div>
    </div>
  );
}
