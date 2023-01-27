import Center from 'client/global/components/tailwind/Center';
import { ServiceContext } from 'client/portal/vendor/settings/service/VendorServiceContext';
import VendorSettingPerformableProviders from 'client/portal/vendor/settings/VendorSettingPerformableProviders';
import * as React from 'react';
import { useContext } from 'react';

export default function VendorServiceProviders() {
  const { write, read } = useContext(ServiceContext);

  return (
    <Center padding>
      <VendorSettingPerformableProviders performableId={read.id} state={write.providers} />
    </Center>
  );
}
