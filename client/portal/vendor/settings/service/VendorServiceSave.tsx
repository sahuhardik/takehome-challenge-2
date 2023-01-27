import { Downgraded, useState } from '@hookstate/core';
import ActionBar from 'client/global/layout/ActionBar';
import { ServiceContext } from 'client/portal/vendor/settings/service/VendorServiceContext';
import * as React from 'react';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { VendorSettingsServiceSaveDocument } from 'shared/generated';
import { useMutationPromise } from 'shared/Graph';

export default function VendorServiceSave() {
  const { serviceId } = useParams();
  const { write } = useContext(ServiceContext);

  const state = useState(write);
  state.attach(Downgraded);

  const updateService = useMutationPromise(VendorSettingsServiceSaveDocument);

  const onSave = async () => {
    const data = {
      variants: [],
      steps: [],
      dependencies: [],
      ...state.get(),
      notifications: state.get().notifications.filter((n) => !!n.enabled),
      providers: state.providers.get().map((x) => ({
        providerId: x.providerId,
        expense: x.expense,
        type: x.type,
        overrideType: x.overrideType,
        properties: x.properties,
      })),
    };

    await updateService({ serviceId, data });
  };

  return <ActionBar state={write} onClick={onSave} />;
}
