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
import FormSelect from 'shared/components/form/FormSelect';
import FormText from 'shared/components/form/FormText';
import {
  JobAssignmentType,
  NotificationConfigEmail,
  NotificationConfigSlack,
  NotificationConfigSms,
  NotificationMethod,
  NotificationType,
  PerformableInputType,
  PerformableOutputType,
  TaskWrite,
  VendorTaskCreateDocument,
  VendorTaskGetDocument,
  VendorTasksDocument,
  VendorTaskUpdateDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import EditIcon from 'shared/icons/EditIcon';
import GeneralIcon from 'shared/icons/GeneralIcon';
import NotificationsIcon from 'shared/icons/NotificationsIcon';
import ProviderIcon from 'shared/icons/ProviderIcon';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';
import VendorSettingsTaskRules from './VendorSettingsTaskRules';

const INPUT_TYPE = [
  { label: 'Images', value: PerformableInputType.Image },
  { label: 'Link', value: PerformableInputType.Link },
  { label: 'Matterport', value: PerformableInputType.Matterport },
  { label: 'Video', value: PerformableInputType.Video },
];

const OUTPUT_TYPE = [
  { label: 'Download', value: PerformableOutputType.Download },
  { label: 'HDPhotoHub', value: PerformableInputType.Hdphotohub },
];

function VendorSettingsTasksEditGeneral({ form }: { form: State<TaskWrite> }) {
  const scopedState = useState(form);

  return (
    <FormGroup>
      <FormHorizontal state={scopedState.name} lang="name">
        <FormText state={scopedState.name} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.shortName} name="Short Name">
        <FormText state={scopedState.shortName} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.inputType} lang="inputType">
        <FormSelect state={scopedState.inputType} options={INPUT_TYPE} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.outputType} lang="outputType">
        <FormSelect state={scopedState.outputType} options={OUTPUT_TYPE} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.assignmentType} name="Assignment Type">
        <FormSelect
          state={scopedState.assignmentType}
          options={[
            {
              value: JobAssignmentType.Manual,
              label: 'Manually assign service to internal user',
            },
            {
              value: JobAssignmentType.Unclaimed,
              label: 'Automatically assign to any available provider when ready',
            },
          ]}
        />
      </FormHorizontal>
      <FormHorizontal state={scopedState.expense} lang="expense">
        <FormMoney state={scopedState.expense} />
      </FormHorizontal>
    </FormGroup>
  );
}

function VendorSettingsTaskNotifications({ form }: { form: State<TaskWrite> }) {
  const vendorId = useCurrentVendorId();
  const scopedState = useState(form);

  const mapping: Map<NotificationType, State<TaskWrite['notifications'][0]>[]> = new Map();

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

function VendorSettingsTasksEdit() {
  const { task } = useParams();

  const query = useQueryHook(VendorTaskGetDocument, { taskId: task });

  const form = useState<TaskWrite>(query.task);

  ValidationAttach(form, (validator) => {
    validator.name.required();

    const enabled = validator.notifications.when((n) => n.enabled.get());

    enabled.message.required();
    enabled.when((n) => n.method.get() === NotificationMethod.Slack).channel.required();
    enabled.when((n) => n.method.get() === NotificationMethod.Email).subject.required();
  });

  const update = useMutationPromise(VendorTaskUpdateDocument);

  useRegisterBreadcrumb(query.task.name);

  const button = (
    <PromiseButton
      disabled={!Validation(form).valid(true)}
      key="save"
      onClick={async () => {
        await update({
          taskId: task,
          data: {
            name: form.name.get(),
            shortName: form.shortName.get(),
            expense: form.expense.get(),
            inputType: form.inputType.get(),
            outputType: form.outputType.get(),
            assignmentType: form.assignmentType.get(),
            providers: form.providers.get().map((x) => ({
              providerId: x.providerId,
              expense: x.expense,
              type: x.type,
              overrideType: x.overrideType,
              properties: x.properties,
            })),
            notifications: form.notifications
              .get()
              .filter((n) => n.enabled)
              .map((n) => ({
                type: n.type,
                message: n.message,
                subject: n.method === NotificationMethod.Email ? n.subject : undefined,
                method: n.method,
                attachments: n.method === NotificationMethod.Email ? n.attachments : [],
                channel: n.method === NotificationMethod.Slack ? n.channel : undefined,
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
      useElement: <VendorSettingsTasksEditGeneral form={form} />,
      error: () => !Validation(useState(form)).valid(true, ['name', 'expense']), // eslint-disable-line react-hooks/rules-of-hooks
    },
    {
      name: 'Notifications',
      key: 'notifications',
      useElement: <VendorSettingsTaskNotifications form={form} />,
      icon: <NotificationsIcon />,
      error: () => !Validation(useState(form.notifications)).valid(true), // eslint-disable-line react-hooks/rules-of-hooks
    },
    {
      name: 'Providers',
      key: 'providers',
      icon: <ProviderIcon />,
      useElement: <VendorSettingPerformableProviders performableId={task} state={form.providers} />,
      error: () => !Validation(useState(form.providers)).valid(true), // eslint-disable-line react-hooks/rules-of-hooks
    },
    {
      name: 'Rules',
      key: 'rules',
      icon: <ProviderIcon />,
      useElement: <VendorSettingsTaskRules task={query.task} />,
      error: () => !Validation(useState(form.providers)).valid(true), // eslint-disable-line react-hooks/rules-of-hooks
    },
  ];

  return (
    <Center small>
      <Toolbar title="Update Task" actions={[button]}>
        <Tabs tabs={tabs} />
      </Toolbar>
    </Center>
  );
}

function VendorSettingsTasksCreate() {
  const { vendorId } = useParams();
  const form = useState({ notifications: [], providers: [] } as TaskWrite);

  ValidationAttach(form, (validator) => {
    validator.name.required();
  });

  useRegisterBreadcrumb('Create');

  const create = useMutationPromise(VendorTaskCreateDocument);
  const navigate = useNavigate();

  const button = (
    <PromiseButton
      key="create"
      disabled={!Validation(form).valid(true)}
      onClick={async () => {
        await create({
          vendorId,
          data: {
            name: form.name.get(),
            shortName: form.shortName.get(),
            expense: form.expense.get(),
            inputType: form.inputType.get(),
            assignmentType: form.assignmentType.get(),
            outputType: form.outputType.get(),
            providers: [],
            notifications: [],
          },
        });

        navigate('../');
      }}
    >
      Create
    </PromiseButton>
  );

  return (
    <Center small>
      <Toolbar title="Create Task" actions={[button]}>
        <FormGroup>
          <FormHorizontal state={form.name} lang="name">
            <FormText state={form.name} />
          </FormHorizontal>
          <FormHorizontal state={form.shortName} name="Short Name">
            <FormText state={form.shortName} />
          </FormHorizontal>
          <FormHorizontal state={form.inputType} lang="inputType">
            <FormSelect state={form.inputType} options={INPUT_TYPE} />
          </FormHorizontal>
          <FormHorizontal state={form.outputType} lang="outputType">
            <FormSelect state={form.outputType} options={OUTPUT_TYPE} />
          </FormHorizontal>
          <FormHorizontal state={form.expense} lang="expense">
            <FormMoney state={form.expense} />
          </FormHorizontal>
        </FormGroup>
      </Toolbar>
    </Center>
  );
}

function VendorSettingsTasksList() {
  const { vendorId } = useParams();

  const query = useQueryHook(VendorTasksDocument, { vendorId }, 'cache-and-network');
  const tasks = query.vendor.tasks.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Center small>
      <Table card>
        <TableHead>
          <TableRow>
            <TableHeadCell>Task Name</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>
              <Link icon={<AddIcon />} to="./create" style={LinkStyle.BOLD}>
                Create Task
              </Link>
            </TableCell>
          </TableRow>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <Link icon={<EditIcon />} to={`./${task.id}`}>
                  {task.name}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Center>
  );
}

export default function VendorSettingsTasks() {
  return (
    <Routes>
      <Route path="/" element={<VendorSettingsTasksList />} />
      <Route path="/create" element={<VendorSettingsTasksCreate />} />
      <Route path="/:task/*" element={<VendorSettingsTasksEdit />} />
    </Routes>
  );
}
