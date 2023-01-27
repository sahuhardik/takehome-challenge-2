import { State, useState } from '@hookstate/core';
import { useRegisterBreadcrumb } from 'client/global/components/BreadcrumbBar';
import FormMoney from 'client/global/components/form/FormMoney';
import FormNotification from 'client/global/components/form/FormNotification';
import Center from 'client/global/components/tailwind/Center';
import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import Tabs, { Tab } from 'client/global/components/tailwind/Tabs';
import Toolbar from 'client/global/components/tailwind/Toolbar';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import VendorSettingPerformableProviders from 'client/portal/vendor/settings/VendorSettingPerformableProviders';
import * as React from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormGroups, FormHorizontal } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';
import {
  DeliveryWrite,
  NotificationConfigEmail,
  NotificationConfigSlack,
  NotificationConfigSms,
  NotificationMethod,
  NotificationType,
  VendorDeliveriesDocument,
  VendorDeliveryCreateDocument,
  VendorDeliveryGetDocument,
  VendorDeliveryUpdateDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import EditIcon from 'shared/icons/EditIcon';
import GeneralIcon from 'shared/icons/GeneralIcon';
import NotificationsIcon from 'shared/icons/NotificationsIcon';
import ProviderIcon from 'shared/icons/ProviderIcon';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

function VendorSettingsDeliveriesEditGeneral({ form }: { form: State<DeliveryWrite> }) {
  const scopedState = useState(form);

  return (
    <FormGroup>
      <FormHorizontal state={scopedState.name} lang="name">
        <FormText state={scopedState.name} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.expense} lang="expense">
        <FormMoney state={scopedState.expense} />
      </FormHorizontal>
    </FormGroup>
  );
}

function VendorSettingsDeliveryNotifications({ form }: { form: State<DeliveryWrite> }) {
  const vendorId = useCurrentVendorId();
  const scopedState = useState(form);

  const mapping: Map<NotificationType, State<DeliveryWrite['notifications'][0]>[]> = new Map();

  scopedState.notifications.forEach((n) => {
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

function VendorSettingsDeliveriesEdit() {
  const { delivery } = useParams();

  const query = useQueryHook(VendorDeliveryGetDocument, { deliveryId: delivery });

  const form = useState<DeliveryWrite>(query.delivery);

  ValidationAttach(form, (validator) => {
    validator.name.required();

    const enabled = validator.notifications.when((n) => n.enabled.get());

    enabled.message.required();
    enabled.when((n) => n.method.get() === NotificationMethod.Slack).channel.required();
    enabled.when((n) => n.method.get() === NotificationMethod.Email).subject.required();
  });

  useRegisterBreadcrumb(query.delivery.name);

  const update = useMutationPromise(VendorDeliveryUpdateDocument);

  const button = (
    <PromiseButton
      key="save"
      disabled={!Validation(form).valid(true)}
      onClick={async () => {
        await update({
          deliveryId: delivery,
          data: {
            name: form.name.get(),
            expense: form.expense.get(),
            notifications: form.notifications
              .get()
              .filter((n) => n.enabled)
              .map((n) => ({
                type: n.type,
                message: n.message,
                subject: n.method === NotificationMethod.Email ? n.subject : undefined,
                attachments: n.method === NotificationMethod.Email ? n.attachments : [],
                method: n.method,
                channel: n.method === NotificationMethod.Slack ? n.channel : undefined,
              })),
            providers: form.providers.get().map((x) => ({
              providerId: x.providerId,
              expense: x.expense,
              type: x.type,
              overrideType: x.overrideType,
              properties: x.properties,
            })),
          },
        });
      }}
    >
      Save
    </PromiseButton>
  );

  const tabs: Tab[] = [
    {
      name: 'General',
      key: 'general',
      icon: <GeneralIcon />,
      useElement: <VendorSettingsDeliveriesEditGeneral form={form} />,
      error: () => !Validation(useState(form)).valid(true, ['name', 'expense']), // eslint-disable-line react-hooks/rules-of-hooks
    },
    {
      name: 'Notifications',
      key: 'notifications',
      useElement: <VendorSettingsDeliveryNotifications form={form} />,
      icon: <NotificationsIcon />,
      error: () => !Validation(useState(form.notifications)).valid(true), // eslint-disable-line react-hooks/rules-of-hooks
    },
    {
      name: 'Providers',
      key: 'providers',
      icon: <ProviderIcon />,
      useElement: <VendorSettingPerformableProviders performableId={delivery} state={form.providers} />,
      error: () => !Validation(useState(form.providers)).valid(true), // eslint-disable-line react-hooks/rules-of-hooks
    },
  ];

  return (
    <Center small>
      <Toolbar title="Update Delivery" actions={[button]}>
        <Tabs tabs={tabs} />
      </Toolbar>
    </Center>
  );
}

function VendorSettingsDeliveriesCreate() {
  const { vendorId } = useParams();
  const form = useState({ notifications: [], providers: [] } as DeliveryWrite);

  ValidationAttach(form, (validator) => {
    validator.name.required();
  });

  useRegisterBreadcrumb('Create');

  const create = useMutationPromise(VendorDeliveryCreateDocument);
  const navigate = useNavigate();

  const button = (
    <PromiseButton
      key="create"
      disabled={!Validation(form).valid(true)}
      onClick={async () => {
        await create({
          data: {
            name: form.name.get(),
            expense: form.expense.get(),
            notifications: [],
            providers: form.providers.get(),
          },
          vendorId,
        });

        navigate('../');
      }}
    >
      Create
    </PromiseButton>
  );
  return (
    <Center small>
      <Toolbar title="Create Delivery" actions={[button]}>
        <FormGroup>
          <FormHorizontal state={form.name} lang="name">
            <FormText state={form.name} />
          </FormHorizontal>
          <FormHorizontal state={form.expense} lang="expense">
            <FormMoney state={form.expense} />
          </FormHorizontal>
        </FormGroup>
      </Toolbar>
    </Center>
  );
}

function VendorSettingsDeliveriesList() {
  const { vendorId } = useParams();

  const query = useQueryHook(VendorDeliveriesDocument, { vendorId }, 'cache-and-network');

  const deliverys = query.vendor.deliveries.sort((a, b) => a.name.localeCompare(b.name));
  const navigate = useNavigate();

  return (
    <Center small>
      <Table card>
        <TableHead>
          <TableRow>
            <TableHeadCell>Delivery Name</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>
              <Link icon={<AddIcon />} to="./create" style={LinkStyle.BOLD}>
                Create Delivery
              </Link>
            </TableCell>
          </TableRow>
          {deliverys.map((delivery) => (
            <TableRow onClick={() => navigate(`./${delivery.id}`)} key={delivery.id}>
              <TableCell>
                <Link icon={<EditIcon />} to={`./${delivery.id}`}>
                  {delivery.name}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Center>
  );
}

export default function VendorSettingsDeliveries() {
  return (
    <Routes>
      <Route path="/" element={<VendorSettingsDeliveriesList />} />
      <Route path="/create" element={<VendorSettingsDeliveriesCreate />} />
      <Route path="/:delivery/*" element={<VendorSettingsDeliveriesEdit />} />
    </Routes>
  );
}
