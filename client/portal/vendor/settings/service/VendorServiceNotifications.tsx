import { State, useState } from '@hookstate/core';
import FormNotification from 'client/global/components/form/FormNotification';
import Center from 'client/global/components/tailwind/Center';
import Tabs, { Tab } from 'client/global/components/tailwind/Tabs';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import { ServiceContext } from 'client/portal/vendor/settings/service/VendorServiceContext';
import * as React from 'react';
import { useContext } from 'react';
import { FormGroups } from 'shared/components/form/FormLayout';
import {
  NotificationConfigEmail,
  NotificationConfigSlack,
  NotificationConfigSms,
  NotificationMethod,
  NotificationType,
  ServiceWrite,
} from 'shared/generated';
import CustomersIcon from 'shared/icons/CustomersIcon';
import InternalIcon from 'shared/icons/InternalIcon';
import ProvidersIcon from 'shared/icons/ProvidersIcon';
import { Validation } from 'shared/utilities/Validation';

function VendorServiceNotificationsGroup({ types }: { types: NotificationType[] }) {
  const vendorId = useCurrentVendorId();
  const { write } = useContext(ServiceContext);
  const state = useState(write);

  const mapping: Map<NotificationType, State<ServiceWrite['notifications'][0]>[]> = new Map();

  state.notifications.forEach((n) => {
    if (!types.includes(n.type.get())) {
      return;
    }

    if (!mapping.has(n.type.get())) {
      mapping.set(n.type.get(), []);
    }

    mapping.get(n.type.get()).push(n);
  });

  return (
    <FormGroups>
      <>
        {Array.from(mapping.entries()).map(([type, states]) => {
          // TODO: update zeus to do __typename switching
          /* eslint-disable react-hooks/rules-of-hooks, @typescript-eslint/no-explicit-any */
          const sms = states.find(
            (s) => s.method.get() === NotificationMethod.Sms
          ) as any as State<NotificationConfigSms>;
          const email = states.find(
            (s) => s.method.get() === NotificationMethod.Email
          ) as any as State<NotificationConfigEmail>;
          const slack = states.find(
            (s) => s.method.get() === NotificationMethod.Slack
          ) as any as State<NotificationConfigSlack>;
          /* eslint-enable react-hooks/rules-of-hooks, @typescript-eslint/no-explicit-any */

          return <FormNotification sms={sms} email={email} slack={slack} key={type} meta={{ vendorId }} />;
        })}
      </>
    </FormGroups>
  );
}

export default function VendorServiceNotifications() {
  const providers: NotificationType[] = [
    NotificationType.JobAssigned,
    NotificationType.JobAssignedConfirm,
    NotificationType.JobCanceled,
    NotificationType.JobHeld,
    NotificationType.JobReady,
    NotificationType.JobUpdated,
    NotificationType.JobChangeAccept,
    NotificationType.JobChangeReject,
    NotificationType.DeliverableAccept,
    NotificationType.DeliverableReject,
  ];

  const customers: NotificationType[] = [
    NotificationType.JobDelivered,
    NotificationType.JobDeliveredSelect,
    NotificationType.JobDeliveredReview,
    NotificationType.JobScheduled,
    NotificationType.JobRescheduled,
    NotificationType.JobTransitEnroute,
    NotificationType.JobTransitOnsite,
    NotificationType.JobTransitEnd,
    NotificationType.JobTransitReminder,
  ];

  const internal: NotificationType[] = [
    NotificationType.JobAccepted,
    NotificationType.JobMoved,
    NotificationType.JobChangeRequest,
    NotificationType.JobSubmitted,
  ];

  const { write } = useContext(ServiceContext);

  const tabs: Tab[] = [
    {
      name: 'Providers',
      key: 'providers',
      useElement: <VendorServiceNotificationsGroup types={providers} />,
      icon: <ProvidersIcon />,
      error: () =>
        // eslint-disable-next-line react-hooks/rules-of-hooks
        !Validation(useState(write.notifications)).valid(true, (s) => providers.includes(s.type.get())),
    },
    {
      name: 'Customers',
      key: 'customers',
      icon: <CustomersIcon />,
      useElement: <VendorServiceNotificationsGroup types={customers} />,
      error: () =>
        // eslint-disable-next-line react-hooks/rules-of-hooks
        !Validation(useState(write.notifications)).valid(true, (s) => customers.includes(s.type.get())),
    },
    {
      name: 'Internal',
      key: 'internal',
      icon: <InternalIcon />,
      useElement: <VendorServiceNotificationsGroup types={internal} />,
      error: () =>
        // eslint-disable-next-line react-hooks/rules-of-hooks
        !Validation(useState(write.notifications)).valid(true, (s) => internal.includes(s.type.get())),
    },
  ];

  return (
    <Center padding>
      <Tabs tabs={tabs} />
    </Center>
  );
}
