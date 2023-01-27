import { State, useState } from '@hookstate/core';
import FormPhone from 'client/global/components/form/FormPhone';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import { BuyerToolbar } from 'client/portal/buyer/BuyerToolbar';
import * as React from 'react';
import PromiseButton from 'shared/components/button/PromiseButton';
import FieldsConfigureForm from 'shared/components/fields/FieldsConfigureForm';
import FormAddress from 'shared/components/form/FormAddress/FormAddress';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormText from 'shared/components/form/FormText';
import { BuyerCustomerFormDocument, BuyerProfileUpdate, FieldRole, MemberType } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import { Validation } from 'shared/utilities/Validation';

export interface BuyerCustomerFormProps {
  state: State<BuyerProfileUpdate>;
  mutation: (data: BuyerProfileUpdate) => Promise<void>;
  title: string;
}

function CustomerGeneral({ state, vendorId }: { state: State<BuyerProfileUpdate>; vendorId: string }) {
  const { vendor } = useQueryHook(BuyerCustomerFormDocument, { vendorId }, 'cache-and-network');
  const scopedState = useState(state);

  const isOrg = state.type.get() === MemberType.Organization;

  return (
    <FormGroup>
      <FormHorizontal state={scopedState.company} name="Name">
        <FormText state={scopedState.company} />
      </FormHorizontal>
      {isOrg && (
        <FormHorizontal state={scopedState.buyerGroupTypeId} name="Organization Type">
          <FormSelect
            state={scopedState.buyerGroupTypeId}
            options={vendor.buyerGroupTypes.map((t) => ({ label: t.name, value: t.id }))}
          />
        </FormHorizontal>
      )}
      <FormHorizontal
        state={scopedState.email}
        name="Email"
        description="A public email address used by the customer for marketing purposes. This email will NOT be used for sending messages or notifications (that is reserved for the users attached to this account)."
      >
        <FormText type="email" state={scopedState.email} />
      </FormHorizontal>
      <FormHorizontal
        state={scopedState.phone}
        name="Phone"
        description="A public phone number used by the customer for marketing purposes. This number will NOT be used for sending messages or notifications (that is reserved for the users attached to this account)."
      >
        <FormPhone state={scopedState.phone} />
      </FormHorizontal>
      <FieldsConfigureForm
        context={{}}
        fields={vendor.fields.filter((f) => f.role === FieldRole.Buyer && f.showOnSelfEdit)}
        state={state.properties}
      />
      <FormHorizontal state={scopedState.address} name="Address">
        <FormAddress state={scopedState.address} coords={vendor.address} />
      </FormHorizontal>
    </FormGroup>
  );
}

export default function BuyerCustomerForm({ title, state, mutation }: BuyerCustomerFormProps) {
  const vendorId = useCurrentVendorId();

  return (
    <BuyerToolbar
      title={title}
      actions={
        <PromiseButton
          onClick={async () => {
            await mutation(state.get());
          }}
          disabled={!Validation(state).valid(true)}
        >
          Save
        </PromiseButton>
      }
    >
      <CustomerGeneral state={state} vendorId={vendorId} />
    </BuyerToolbar>
  );
}
