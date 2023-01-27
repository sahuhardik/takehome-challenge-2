import { none, State, useState } from '@hookstate/core';
import SlidebarOpenButton, {
  SlidebarCloseButton,
  SlidebarOpenLink,
} from 'client/global/components/button/SlidebarOpenButton';
import Card from 'client/global/components/tailwind/Card';
import Center from 'client/global/components/tailwind/Center';
import { LinkStyle } from 'client/global/components/tailwind/Link';
import SpinnerLoader from 'client/global/components/tailwind/SpinnerLoader';
import { Table, TableCell, TableHead, TableHeadCell, TableRow } from 'client/global/components/tailwind/Table';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import ActionBar from 'client/global/layout/ActionBar';
import { SlidebarContent, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import { convertConditions } from 'client/portal/vendor/components/condition/utils';
import VendorConditions from 'client/portal/vendor/components/condition/VendorConditions';
import RuleConditionBuyerField from 'client/portal/vendor/components/rule/condition/RuleConditionBuyerField';
import RuleConditionOrderBuyer from 'client/portal/vendor/components/rule/condition/RuleConditionOrderBuyer';
import RuleConditionOrderDayOfWeek from 'client/portal/vendor/components/rule/condition/RuleConditionOrderDayOfWeek';
import RuleConditionOrderField from 'client/portal/vendor/components/rule/condition/RuleConditionOrderField';
import RuleConditionOrderTime from 'client/portal/vendor/components/rule/condition/RuleConditionOrderTime';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { PerformableFormType } from 'shared/components/fields/PerformableConfigureForm';
import ServiceConfigureForm, { useServiceConfigureForm } from 'shared/components/fields/ServiceConfigureForm';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import {
  ConditionWrite,
  FieldValueWrite,
  GetVendorPackageDocument,
  ListVendorPackagesDocument,
  PackagePerformableWrite,
  PackageWrite,
  PerformableType,
  SaveVendorPackageDocument,
  VendorPerformablesDocument,
  VendorServiceDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise, useQuerySuspense } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import DeleteIcon from 'shared/icons/DeleteIcon';
import EditIcon from 'shared/icons/EditIcon';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';
import { v4 } from 'uuid';

function emptyService() {
  return {
    id: v4(),
    fields: [],
  } as PackagePerformableWrite;
}

function ServiceForm({
  serviceId,
  onAdd,
}: {
  serviceId: string;
  onAdd: (serviceId: string, fields: FieldValueWrite[]) => void;
}) {
  const form = useServiceConfigureForm(serviceId, PerformableFormType.TEMPLATE, []);

  return (
    <>
      <FormGroup>
        <ServiceConfigureForm serviceId={serviceId} type={PerformableFormType.TEMPLATE} state={form} />
      </FormGroup>
      <SlidebarCloseButton style={ButtonStyle.QUIET}>Cancel</SlidebarCloseButton>
      <SlidebarCloseButton
        disabled={form}
        onClick={async () => {
          onAdd(serviceId, form.get());

          return false;
        }}
      >
        Add Service
      </SlidebarCloseButton>
    </>
  );
}

function PickService({
  state,
  service,
}: {
  state: State<PackagePerformableWrite[]>;
  service: State<PackagePerformableWrite>;
}) {
  const vendorId = useCurrentVendorId();
  const scopedState = useState(state);

  const { vendor } = useQueryHook(VendorPerformablesDocument, { vendorId }, 'cache-and-network');

  const added = scopedState.get().map((perf) => perf.performableId);

  const performables = vendor.performables.filter(
    (perf) => perf.type === PerformableType.Service && !added.includes(perf.id)
  );

  return (
    <Card>
      <div className="divide-y divide-content">
        {performables.map((p) => {
          const add = () => {
            service.performableId.set(p.id);
          };

          return (
            <div onClick={add} className="p-2 hover:bg-hover cursor-pointer" key={p.id}>
              {p.internalName || p.name}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function AddService({ state, group }: { state: State<PackagePerformableWrite[]>; group?: number }) {
  const scopedState = useState(state);

  const form = useState(emptyService());

  const onClose = () => {
    form.set(emptyService());
  };

  const content = (
    <>
      <SlidebarHeader title="Choose one" />
      <SlidebarContent>
        {form.performableId.get() ? (
          <ServiceForm
            serviceId={form.performableId.get()}
            onAdd={(performableId, fields) => {
              scopedState.merge([
                {
                  id: v4(),
                  performableId,
                  group: group || scopedState.length,
                  fields,
                },
              ]);
            }}
          />
        ) : (
          <PickService state={state} service={form} />
        )}
      </SlidebarContent>
    </>
  );

  if (typeof group === 'number') {
    return (
      <SlidebarOpenLink text="Add Service" onClose={onClose} icon={<AddIcon />} style={LinkStyle.BOLD}>
        {content}
      </SlidebarOpenLink>
    );
  }

  return (
    <SlidebarOpenButton button="Add Group" onClose={onClose} icon={<AddIcon />}>
      {content}
    </SlidebarOpenButton>
  );
}

function AddedService({ state }: { state: State<PackagePerformableWrite> }) {
  const scope = useState(state);
  const serviceId = scope.performableId.get();
  const { service } = useQueryHook(VendorServiceDocument, { serviceId });

  const form = useServiceConfigureForm(serviceId, PerformableFormType.TEMPLATE, scope.fields.get());

  return (
    <TableRow>
      <TableCell>
        <Button style={ButtonStyle.DANGER} icon={<DeleteIcon />} slim onClick={() => scope.set(none)} />
      </TableCell>
      <TableCell className="w-full">
        <SlidebarOpenLink
          text={service.internalName || service.name}
          icon={<EditIcon />}
          style={LinkStyle.BOLD}
          onClose={() => {
            if (!Validation(form).valid(true)) {
              return false;
            }

            scope.fields.set(JSON.parse(JSON.stringify(form.get())));
          }}
        >
          <ActionBar
            state={form}
            button="Close"
            valid="Make sure to save the package after updating the service configuration."
            onClick={async () => {
              scope.fields.set(JSON.parse(JSON.stringify(form.get())));

              return false;
            }}
          />
          <SlidebarContent>
            <FormGroup>
              <ServiceConfigureForm serviceId={serviceId} type={PerformableFormType.TEMPLATE} state={form} />
            </FormGroup>
          </SlidebarContent>
        </SlidebarOpenLink>
      </TableCell>
    </TableRow>
  );
}

function ServiceList({ state }: { state: State<PackagePerformableWrite[]> }) {
  const scope = useState(state);

  if (scope.length === 0) {
    return (
      <Card>
        <Message type={MessageType.ERROR} round>
          You must add at least one service to this package.
        </Message>

        <AddService state={state} group={0} />
      </Card>
    );
  }

  const groups = new Map<number, State<PackagePerformableWrite>[]>();

  for (const perf of scope.values()) {
    if (!groups.has(perf.group.get())) {
      groups.set(perf.group.get(), []);
    }

    groups.get(perf.group.get()).push(perf);
  }

  return (
    <>
      {Array.from(groups.entries()).map(([group, perfs]) => (
        <Card className="space-y-4" key={group}>
          <SpinnerLoader key={group}>
            {perfs.length > 1 && (
              <Message type={MessageType.INFO} title="User Selectable" round className="mb-2">
                When multiple services are assigned to the same group, the user will be given the option to choose{' '}
                <strong>one</strong> of the services in the group.
              </Message>
            )}
            <Table border round className="mb-2">
              <TableHead>
                <TableRow>
                  <TableHeadCell />
                  <TableHeadCell>Service</TableHeadCell>
                </TableRow>
              </TableHead>
              {perfs.map((perf) => (
                <AddedService state={perf} key={perf.id.get()} />
              ))}
              <TableRow>
                <TableCell />
                <TableCell>
                  <AddService state={state} group={group} />
                </TableCell>
              </TableRow>
            </Table>
          </SpinnerLoader>
        </Card>
      ))}
    </>
  );
}

function VendorPackageForm({ seed }: { seed: PackageWrite }) {
  const vendorId = useCurrentVendorId();

  const state = useState(seed);

  ValidationAttach(state, (validator) => {
    validator.name.required();
    validator.performables.required();
  });

  const save = useMutationPromise(SaveVendorPackageDocument);
  const refresh = useQueryPromise(ListVendorPackagesDocument);

  return (
    <>
      <ActionBar
        state={state}
        onClick={async () => {
          await save({ data: state.get() });
          await refresh({ vendorId });
        }}
      />
      <Center padding>
        <div className="space-y">
          <FormGroup>
            <FormHorizontal state={state.name} name="Package Name">
              <FormText state={state.name} />
            </FormHorizontal>
          </FormGroup>
          <div className="space-y-2">
            <div className="text-2xl font-semibold">Services</div>
            <ServiceList state={state.performables} />
            <AddService state={state.performables} />
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-semibold">Conditions</div>
            <VendorConditions
              state={state.conditions}
              types={[
                RuleConditionBuyerField,
                RuleConditionOrderField,
                RuleConditionOrderBuyer,
                RuleConditionOrderDayOfWeek,
                RuleConditionOrderTime,
              ]}
            />
          </div>
        </div>
      </Center>
    </>
  );
}

export function VendorPackageCreate() {
  const vendorId = useCurrentVendorId();

  return (
    <VendorPackageForm
      seed={{
        id: v4(),
        vendorId,
        name: null as string,
        performables: [] as PackagePerformableWrite[],
        conditions: [] as ConditionWrite[],
      }}
    />
  );
}

export function VendorPackageEdit() {
  const { packageId } = useParams();
  const vendorId = useCurrentVendorId();

  const query = useQuerySuspense(GetVendorPackageDocument, { packageId }, 'network-only');

  return (
    <VendorPackageForm
      seed={{
        id: packageId,
        vendorId,
        name: query.package.name,
        performables: query.package.performables,
        conditions: convertConditions(query.package.conditions),
      }}
    />
  );
}
