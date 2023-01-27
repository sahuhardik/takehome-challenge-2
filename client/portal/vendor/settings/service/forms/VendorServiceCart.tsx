import { useState } from '@hookstate/core';
import Center from 'client/global/components/tailwind/Center';
import { ServiceContext } from 'client/portal/vendor/settings/service/VendorServiceContext';
import * as React from 'react';
import { useContext } from 'react';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSwitch from 'shared/components/form/FormSwitch';

export default function VendorServiceCart() {
  const { write } = useContext(ServiceContext);
  const state = useState(write);

  return (
    <Center padding>
      <FormGroup>
        <FormHorizontal
          state={state.cartEnable}
          name="Show in Cart"
          description="When enabled, this service is eligible to show in the additional services area of cart (assuming it is not featured in the wizard)."
        >
          <FormSwitch state={state.cartEnable} />
        </FormHorizontal>
      </FormGroup>
    </Center>
  );
}
