import { useState } from '@hookstate/core';
import { FormPostal } from 'client/global/components/condition/ConditionPostals';
import Center from 'client/global/components/tailwind/Center';
import { VendorSettingsContext } from 'client/portal/vendor/settings/VendorSettingsData';
import * as React from 'react';
import { useContext } from 'react';
import { FormHorizontal } from 'shared/components/form/FormLayout';
import FormSwitch from 'shared/components/form/FormSwitch';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

export default function VendorSettingsServiceArea() {
  const { settings } = useContext(VendorSettingsContext);
  const postalCodes = useState(settings.serviceArea);
  const setServiceArea = useState(settings.serviceArea.get() !== null);
  ValidationAttach(setServiceArea);
  ValidationAttach(postalCodes);

  return (
    <Center padding>
      <FormHorizontal name="Set Service Area" state={setServiceArea}>
        <FormSwitch state={setServiceArea} onChange={() => postalCodes.set(setServiceArea.get() ? [] : null)} />
      </FormHorizontal>
      {postalCodes.get() !== null && (
        <FormPostal
          name="Service Area"
          postalsState={postalCodes}
          validate={() => Validation(postalCodes).valid(true)}
        />
      )}
    </Center>
  );
}
