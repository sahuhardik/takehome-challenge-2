import { useState } from '@hookstate/core';
import Center from 'client/global/components/tailwind/Center';
import { ServiceContext } from 'client/portal/vendor/settings/service/VendorServiceContext';
import * as React from 'react';
import { useContext } from 'react';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';

export default function VendorServiceAdvanced() {
  const { write } = useContext(ServiceContext);
  const state = useState(write);

  return (
    <Center padding>
      <FormGroup>
        <FormHorizontal state={state.apiName} lang="apiName">
          <FormText state={state.apiName} />
        </FormHorizontal>
      </FormGroup>
    </Center>
  );
}
