import { State, useState } from '@hookstate/core';
import FormNotification from 'client/global/components/form/FormNotification';
import FormWindow from 'client/global/components/form/FormWindow';
import Center from 'client/global/components/tailwind/Center';
import Tabs, { Tab } from 'client/global/components/tailwind/Tabs';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import { VendorSettingsContext } from 'client/portal/vendor/settings/VendorSettingsData';
import * as React from 'react';
import { useContext } from 'react';
import { FormGroup, FormGroups } from 'shared/components/form/FormLayout';
import {
  NotificationConfigEmail,
  NotificationConfigInput,
  NotificationConfigSlack,
  NotificationConfigSms,
  NotificationMethod,
  NotificationType,
} from 'shared/generated';
import CustomersIcon from 'shared/icons/CustomersIcon';
import GeneralIcon from 'shared/icons/GeneralIcon';
import InternalIcon from 'shared/icons/InternalIcon';
import ProvidersIcon from 'shared/icons/ProvidersIcon';
import { Validation } from 'shared/utilities/Validation';

function VendorSettingsNotificationsGroup({ types }: { types: NotificationType[] }) {
  const vendorId = useCurrentVendorId();
  const { notifications } = useContext(VendorSettingsContext);

  const mapping: Map<NotificationType, State<NotificationConfigInput>[]> = new Map();

  notifications.forEach((n) => {
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

          return <FormNotification sms={sms} email={email} slack={slack} key={type} global meta={{ vendorId }} />;
        })}
      </>
    </FormGroups>
  );
}

function VendorSettingsNotificationsGeneral() {
  const { settings } = useContext(VendorSettingsContext);
  const state = useState(settings);

  return (
    <FormGroup name="General">
      <FormWindow
        state={state.buyerNotificationWindow}
        label="Customer Notification Window"
        description="Notify customers via SMS within a specified time window. All notifications triggered outside of the respective window will be postponed to be received at the start time given of the following day."
      />
      <FormWindow
        state={state.providerNotificationWindow}
        label="Provider Notification Window"
        description="Notify providers via SMS within a specified time window. All notifications triggered outside of the respective window will be postponed to be received at the start time given of the following day."
      />
    </FormGroup>
  );
}

export default function VendorSettingsNotifications() {
  const providers: NotificationType[] = [
    NotificationType.JobAssigned,
    NotificationType.JobAssignedConfirm,
    NotificationType.JobCanceled,
    NotificationType.JobHeld,
    NotificationType.JobReady,
    NotificationType.JobUpdated,
    NotificationType.JobRescheduled,
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
    NotificationType.JobTransitEnroute,
    NotificationType.JobTransitOnsite,
    NotificationType.JobTransitEnd,
    NotificationType.JobTransitReminder,
    NotificationType.OrderConfirm,
    NotificationType.OrderConfirmCharge,
    NotificationType.OrderAcceptance,
    NotificationType.OrderCanceledBuyer,
    NotificationType.OrderReceived,
    NotificationType.OrderComplete,
    NotificationType.OrderCompleteCharge,
    NotificationType.OrderInvoiced,
    NotificationType.OrderQuote,
    NotificationType.AppointmentScheduled,
    NotificationType.AppointmentMoved,
    NotificationType.AppointmentCanceled,
  ];

  const internal: NotificationType[] = [
    NotificationType.JobAccepted,
    NotificationType.JobMoved,
    NotificationType.JobChangeRequest,
    NotificationType.JobSubmitted,
    NotificationType.OrderCompleteInternal,
    NotificationType.OrderCanceledVendor,
    NotificationType.OrderReview,
    NotificationType.OrderSubmitted,
  ];

  const { settings, notifications } = useContext(VendorSettingsContext);

  const tabs: Tab[] = [
    {
      name: 'General',
      key: 'ngeneral',
      icon: <GeneralIcon />,
      useElement: <VendorSettingsNotificationsGeneral />,
      error: () =>
        // eslint-disable-next-line react-hooks/rules-of-hooks
        !Validation(useState(settings)).valid(true, ['buyerNotificationWindow', 'providerNotificationWindow']),
    },
    {
      name: 'Providers',
      key: 'providers',
      useElement: <VendorSettingsNotificationsGroup types={providers} />,
      icon: <ProvidersIcon />,
      error: () =>
        // eslint-disable-next-line react-hooks/rules-of-hooks
        !Validation(useState(notifications)).valid(true, (s) => providers.includes(s.type.get())),
    },
    {
      name: 'Customers',
      key: 'customers',
      icon: <CustomersIcon />,
      useElement: <VendorSettingsNotificationsGroup types={customers} />,
      error: () =>
        // eslint-disable-next-line react-hooks/rules-of-hooks
        !Validation(useState(notifications)).valid(true, (s) => customers.includes(s.type.get())),
    },
    {
      name: 'Internal',
      key: 'internal',
      icon: <InternalIcon />,
      useElement: <VendorSettingsNotificationsGroup types={internal} />,
      error: () =>
        // eslint-disable-next-line react-hooks/rules-of-hooks
        !Validation(useState(notifications)).valid(true, (s) => internal.includes(s.type.get())),
    },
  ];

  return (
    <Center padding>
      <Tabs tabs={tabs} />
    </Center>
  );
}
