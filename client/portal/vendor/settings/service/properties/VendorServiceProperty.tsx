import { useState } from '@hookstate/core';
import Center from 'client/global/components/tailwind/Center';
import Tabs, { Tab } from 'client/global/components/tailwind/Tabs';
import VendorServicePropertyAccounting from 'client/portal/vendor/settings/service/properties/VendorServicePropertyAccounting';
import VendorServicePropertyConditions from 'client/portal/vendor/settings/service/properties/VendorServicePropertyConditions';
import VendorServicePropertyGeneral from 'client/portal/vendor/settings/service/properties/VendorServicePropertyGeneral';
import VendorServicePropertyMarketing from 'client/portal/vendor/settings/service/properties/VendorServicePropertyMarketing';
import VendorServicePropertyOptions from 'client/portal/vendor/settings/service/properties/VendorServicePropertyOptions';
import VendorServicePropertyScheduling from 'client/portal/vendor/settings/service/properties/VendorServicePropertyScheduling';
import VendorServicePropertyWorkflow from 'client/portal/vendor/settings/service/properties/VendorServicePropertyWorkflow';
import { ServiceContext } from 'client/portal/vendor/settings/service/VendorServiceContext';
import * as React from 'react';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { FieldType } from 'shared/generated';
import { Validation } from 'shared/utilities/Validation';

export default function VendorServiceProperty() {
  const { write } = useContext(ServiceContext);

  const { propertyId } = useParams();

  const propertyIndex = write.properties.findIndex((p) => p.id.get() === propertyId);

  const state = useState(write.properties[propertyIndex]);

  const tabs: Tab[] = [
    {
      useElement: <VendorServicePropertyGeneral state={state} />,
      name: 'General',
      key: 'pgeneral',
      error: () => !Validation(useState(state)).valid(), // eslint-disable-line react-hooks/rules-of-hooks
    },
  ];

  if ([FieldType.Select, FieldType.Repeat].includes(state.fieldType.get())) {
    tabs.push(VendorServicePropertyOptions(state));
  }

  tabs.push(VendorServicePropertyWorkflow(state));
  tabs.push(VendorServicePropertyScheduling(state));
  tabs.push(VendorServicePropertyAccounting(state));
  tabs.push(VendorServicePropertyMarketing(state));
  tabs.push(VendorServicePropertyConditions(state, write.properties));

  return (
    <Center padding>
      <Tabs tabs={tabs} />
    </Center>
  );
}
