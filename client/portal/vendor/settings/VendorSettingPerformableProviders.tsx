import { none, State, useState } from '@hookstate/core';
import { FORM_SERVICE_OVERRIDE_OPTIONS } from 'client/const';
import FormMoney from 'client/global/components/form/FormMoney';
import Card from 'client/global/components/tailwind/Card';
import Slidebar, { SlidebarContent, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { FormGroup, FormGroups, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  FieldType,
  PerformableProperty,
  PerformableWriteProvider,
  ProviderWriteServiceProperty,
  TaskWrite,
  VendorPerformablesDocument,
  VendorPerformablesQuery,
  VendorProvidersDocument,
} from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import DeleteIcon from 'shared/icons/DeleteIcon';

type Property = VendorPerformablesQuery['vendor']['performables'][0]['properties'][0];
type PerformableProvidersWrite = TaskWrite['providers'];

function PerformableProperty({
  state,
  property,
  added,
}: {
  property: Property;
  state: State<ProviderWriteServiceProperty>;
  added: State<PerformableWriteProvider>;
}) {
  const scopedState = useState(state);
  const scopedAdded = useState(added);

  return (
    <div className="flex-1 relative">
      <FormGroup>
        <FormHorizontal state={scopedState.propertyId} name="Property">
          {property.name}
        </FormHorizontal>
        {property.fieldType === FieldType.Select && (
          <FormHorizontal state={scopedState.propertyValueId} name="Value" border={false}>
            <FormSelect
              state={scopedState.propertyValueId}
              options={property.values
                .filter(
                  (v) =>
                    !scopedAdded.properties.some(
                      (prop) => prop.propertyValueId.get() === v.id && scopedState.propertyValueId.get() !== v.id
                    )
                )
                .map((v) => ({
                  label: v.name,
                  value: v.id,
                }))}
            />
          </FormHorizontal>
        )}
        <FormHorizontal state={scopedState.expense} name="Expense">
          <FormMoney state={scopedState.expense} />
        </FormHorizontal>
        <FormHorizontal state={scopedState.overrideType} name="Override Type">
          <FormSelect state={scopedState.overrideType} options={FORM_SERVICE_OVERRIDE_OPTIONS} />
        </FormHorizontal>
      </FormGroup>
      <div className="absolute -top-3 -left-3">
        <Button onClick={() => scopedState.set(none)} icon={<DeleteIcon />} style={ButtonStyle.ERROR} />
      </div>
    </div>
  );
}

function AddProperty({ state, properties }: { state: State<PerformableWriteProvider>; properties: Property[] }) {
  const scopedState = useState(state);
  const [show, setShow] = React.useState(false); // eslint-disable-line import/no-named-as-default-member

  if (!properties.length) {
    return <></>;
  }

  return (
    <div>
      <Slidebar show={show} onClose={() => setShow(false)}>
        <SlidebarHeader title="Choose one" />
        <SlidebarContent>
          <Card>
            <div className="divide-y divide-content">
              {properties.map((p) => {
                const add = () => {
                  scopedState.properties.merge([
                    {
                      propertyId: p.id,
                    },
                  ]);

                  setShow(false);
                };

                return (
                  <div onClick={add} className="p-2 hover:bg-hover cursor-pointer" key={p.id}>
                    {p.name}
                  </div>
                );
              })}
            </div>
          </Card>
        </SlidebarContent>
      </Slidebar>
      <Button onClick={() => setShow(true)} icon={<AddIcon />} style={ButtonStyle.QUIET}>
        Add
      </Button>
    </div>
  );
}

function Provider({
  state,
  added,
  properties,
}: {
  state: State<PerformableWriteProvider>;
  added: State<PerformableWriteProvider>;
  properties: Property[];
}) {
  const scopedState = useState(state);
  const scopedAdded = useState(added);

  const { vendorId } = useParams();
  const { vendor } = useQueryHook(VendorProvidersDocument, { vendorId }, 'cache-and-network');

  const provider = vendor.providers.find((p) => p.member.id === scopedState.providerId.get());

  let overrides = <></>;
  if (properties.length > 0) {
    overrides = (
      <div
        className={`flex-1 round-r space-y bg-accent p flex flex-col ${
          state.properties.length > 0 ? 'items-stretch' : 'items-center'
        } justify-center`}
      >
        {state.properties.map((prop) => (
          <PerformableProperty
            key={prop.propertyId.get()}
            state={prop}
            property={properties.find((p) => p.id === prop.propertyId.get())}
            added={scopedAdded}
          />
        ))}
        <AddProperty state={state} properties={properties} />
      </div>
    );
  }

  return (
    <Card onRemove={() => scopedState.set(none)}>
      <div className="text-xl text-gray-800 font-medium -mx-4 sm:-mx-6 sm:-mt-6 bg-accent px-4 py-4 mb-4">
        {provider.member.company}
      </div>
      <div className="flex items-stretch space-x">
        <div className="flex-1">
          <FormGroup plain>
            <FormHorizontal state={scopedState.expense} name="Expense">
              <FormMoney state={scopedState.expense} />
            </FormHorizontal>
            {scopedState.expense.get() && (
              <FormHorizontal state={scopedState.overrideType} name="Override Type">
                <FormSelect state={scopedState.overrideType} options={FORM_SERVICE_OVERRIDE_OPTIONS} />
              </FormHorizontal>
            )}
          </FormGroup>
        </div>
        {overrides}
      </div>
    </Card>
  );
}

function AddProvider({ state }: { state: State<PerformableProvidersWrite> }) {
  const scopedState = useState(state);
  const [show, setShow] = React.useState(false); // eslint-disable-line import/no-named-as-default-member

  const { vendorId } = useParams();
  const { vendor } = useQueryHook(VendorProvidersDocument, { vendorId }, 'cache-and-network');

  const added = scopedState.get().map((perf) => perf.providerId);
  const providers = vendor.providers.filter((perf) => !added.includes(perf.member.id));

  if (providers.length === 0) {
    return <></>;
  }

  return (
    <div>
      <Slidebar show={show} onClose={() => setShow(false)}>
        <SlidebarHeader title="Choose one" />
        <SlidebarContent>
          <Card>
            <div className="divide-y divide-content">
              {providers.map((p) => {
                const add = () => {
                  scopedState.merge([
                    {
                      providerId: p.member.id,
                      properties: [],
                    },
                  ]);

                  setShow(false);
                };

                return (
                  <div onClick={add} className="p-2 hover:bg-hover cursor-pointer" key={p.id}>
                    {p.member.company}
                  </div>
                );
              })}
            </div>
          </Card>
        </SlidebarContent>
      </Slidebar>
      <Button onClick={() => setShow(true)} icon={<AddIcon />} style={ButtonStyle.SECONDARY}>
        Add
      </Button>
    </div>
  );
}

export default function VendorSettingPerformableProviders({
  performableId,
  state,
}: {
  performableId: string;
  state: State<PerformableProvidersWrite>;
}) {
  const scopedState = useState(state);
  const { vendorId } = useParams();
  const { vendor } = useQueryHook(VendorProvidersDocument, { vendorId }, 'cache-and-network');
  const query = useQueryHook(VendorPerformablesDocument, { vendorId }, 'cache-and-network');

  const performable = query.vendor.performables.find((p) => p.id === performableId);
  const providers = vendor.providers.map((p) => p.member.id);
  const filtered = scopedState.filter((p) => providers.includes(p.providerId.get()));

  return filtered.length === 0 ? (
    <div className="space-y">
      <Card>No providers assigned.</Card>
      <AddProvider state={state} />
    </div>
  ) : (
    <FormGroups>
      <>
        {filtered.map((p, index) => (
          <Provider state={p} key={p.providerId.get()} added={scopedState[index]} properties={performable.properties} />
        ))}
        <AddProvider state={state} />
      </>
    </FormGroups>
  );
}
