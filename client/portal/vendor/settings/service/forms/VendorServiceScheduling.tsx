import { useState } from '@hookstate/core';
import Center from 'client/global/components/tailwind/Center';
import { ServiceContext } from 'client/portal/vendor/settings/service/VendorServiceContext';
import * as React from 'react';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormNumber from 'shared/components/form/FormNumber';
import FormSelect from 'shared/components/form/FormSelect';
import FormSwitch from 'shared/components/form/FormSwitch';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import { JobAssignmentType, VendorProvidersDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

export default function VendorServiceScheduling() {
  const { vendorId, serviceId } = useParams();
  const { write } = useContext(ServiceContext);
  const query = useQueryHook(VendorProvidersDocument, { vendorId }, 'cache-and-network');
  const state = useState(write);
  const performCurrentServiceProviders = query.vendor.providers.filter((provider) =>
    provider.performables.some((perf) => perf.performableId === serviceId)
  );

  return (
    <Center padding>
      <FormGroup>
        {!performCurrentServiceProviders.length && state.assignmentType.value === JobAssignmentType.Unclaimed && (
          <Message type={MessageType.WARNING}>No providers are available for an automatic assignment</Message>
        )}

        <FormHorizontal state={state.assignmentType} name="Assignment Type">
          <FormSelect
            state={state.assignmentType}
            options={[
              {
                value: JobAssignmentType.Manual,
                label: 'Manually assign service to provider',
              },
              {
                value: JobAssignmentType.Unclaimed,
                label: 'Automatically assign to any available provider when ready',
              },
            ]}
          />
        </FormHorizontal>
        <FormHorizontal state={state.onsite} name="On-Site Time (minutes)">
          <FormNumber state={state.onsite} />
        </FormHorizontal>
        <FormHorizontal state={state.acknowledgeAssignment} name="Acknowledge Assignment">
          <FormSwitch state={state.acknowledgeAssignment} />
        </FormHorizontal>
        <FormHorizontal state={state.notifyBuyerOnScheduled} name="Notify Buyer on Scheduled">
          <FormSwitch state={state.notifyBuyerOnScheduled} />
        </FormHorizontal>
      </FormGroup>
    </Center>
  );
}
