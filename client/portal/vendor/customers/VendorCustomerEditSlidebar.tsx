import { useState } from '@hookstate/core';
import { SlidebarCloseButton, SlidebarOpenLink } from 'client/global/components/button/SlidebarOpenButton';
import { SlidebarContent, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import { CustomerEditValidation, toBuyerWrite } from 'client/portal/vendor/customers/VendorCustomerUtil';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import FieldsConfigureForm from 'shared/components/fields/FieldsConfigureForm';
import { FormGroupView } from 'shared/components/form/FormLayout/FormLayoutView';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  BuyerWrite,
  FieldRole,
  VendorBuyerUpdateDocument,
  VendorCustomerFormDocument,
  VendorCustomerGetDocument,
  VendorFieldFragment,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import EditIcon from 'shared/icons/EditIcon';

function VendorCustomerEditSlidebarInternal({
  buyerRelId,
  write,
  fields,
  versionId,
}: {
  buyerRelId: string;
  versionId: number;
  write: BuyerWrite;
  fields: VendorFieldFragment[];
}) {
  const state = useState<BuyerWrite>(write);

  const updateBuyer = useMutationPromise(VendorBuyerUpdateDocument);

  CustomerEditValidation(state, fields);

  return (
    <SlidebarOpenLink icon={<EditIcon />}>
      <SlidebarHeader title="Update Customer" />
      <SlidebarContent>
        <FormGroupView>
          <FieldsConfigureForm context={{}} fields={fields} state={state.properties} />
        </FormGroupView>
        <div className="space-x mt">
          <SlidebarCloseButton style={ButtonStyle.SECONDARY}>Cancel</SlidebarCloseButton>
          <SlidebarCloseButton
            onClick={async () => {
              await updateBuyer({ buyerRelId, data: state.get(), versionId });
            }}
          >
            Save
          </SlidebarCloseButton>
        </div>
      </SlidebarContent>
    </SlidebarOpenLink>
  );
}

export default function VendorCustomerEditSlidebar({ buyerRelId }: { buyerRelId: string }) {
  const { vendorId } = useParams();

  const { vendor } = useQueryHook(VendorCustomerFormDocument, { vendorId }, 'no-cache');
  const { buyer } = useQueryHook(VendorCustomerGetDocument, { buyerId: buyerRelId }, 'no-cache');

  const buyerFields = vendor.fields.filter((f) => f.role === FieldRole.Buyer);

  if (buyerFields.length === 0) {
    return <></>;
  }

  const write = toBuyerWrite(buyer);

  // use an internal component so that form state is refreshed every time server state changes
  // TODO: use a buyer version id as key
  return (
    <VendorCustomerEditSlidebarInternal
      buyerRelId={buyerRelId}
      write={write}
      versionId={buyer.versionId}
      fields={buyerFields}
      key={JSON.stringify(write)}
    />
  );
}
