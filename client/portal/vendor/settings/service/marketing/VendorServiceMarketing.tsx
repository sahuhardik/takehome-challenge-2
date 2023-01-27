import { useState } from '@hookstate/core';
import Center from 'client/global/components/tailwind/Center';
import Tabs from 'client/global/components/tailwind/Tabs';
import VendorServiceMarketingImages from 'client/portal/vendor/settings/service/marketing/VendorServiceMarketingImages';
import VendorServiceMarketingLinks from 'client/portal/vendor/settings/service/marketing/VendorServiceMarketingLinks';
import VendorServiceMarketingVideos from 'client/portal/vendor/settings/service/marketing/VendorServiceMarketingVideo';
import { ServiceContext } from 'client/portal/vendor/settings/service/VendorServiceContext';
import * as React from 'react';
import { useContext } from 'react';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';

export default function VendorServiceMarketing() {
  const { write } = useContext(ServiceContext);
  const state = useState(write.marketing);

  return (
    <Center padding>
      <Tabs
        tabs={[
          {
            key: 'general',
            name: 'General',
            useElement: (
              <FormGroup>
                <FormHorizontal state={state.name} name="Name">
                  <FormText state={state.name} />
                </FormHorizontal>
                <FormHorizontal state={state.description} name="Description">
                  <FormText state={state.description} lines={8} />
                </FormHorizontal>
                <FormHorizontal
                  state={state.slimDescription}
                  name="Slim Description"
                  description="Shown in the slim version of the order form (after the customer has placed at least one order in the past)."
                >
                  <FormText state={state.slimDescription} lines={3} />
                </FormHorizontal>
              </FormGroup>
            ),
          },
          {
            key: 'images',
            name: 'Images',
            useElement: <VendorServiceMarketingImages />,
          },
          {
            key: 'videos',
            name: 'Videos',
            useElement: <VendorServiceMarketingVideos />,
          },
          {
            key: 'links',
            name: 'Links',
            useElement: <VendorServiceMarketingLinks />,
          },
        ]}
      />
    </Center>
  );
}
