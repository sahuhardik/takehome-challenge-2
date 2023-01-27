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
  Performable,
  PerformableProperty,
  PerformableType,
  ProviderWrite,
  ProviderWritePerformable,
  ProviderWriteServiceProperty,
  VendorPerformablesDocument,
  VendorPerformablesQuery,
} from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import DeleteIcon from 'shared/icons/DeleteIcon';

function PerformableProperty({
  state,
  property,
  added,
}: {
  property: VendorPerformablesQuery['vendor']['performables'][0]['properties'][0];
  state: State<ProviderWriteServiceProperty>;
  added: State<ProviderWritePerformable>;
}) {
  const scopedState = useState(state);
  const scopedAdded = useState(added);

  return (
    <div className="flex-1 relative">
      <FormGroup>
        <FormHorizontal state={scopedState.propertyId} name="Property">
          {property.name}
        </FormHorizontal>
        <FormHorizontal state={scopedState.expense} name="Expense">
          <FormMoney state={scopedState.expense} />
        </FormHorizontal>
        <FormHorizontal state={scopedState.overrideType} name="Override Type">
          <FormSelect state={scopedState.overrideType} options={FORM_SERVICE_OVERRIDE_OPTIONS} />
        </FormHorizontal>
        {property.fieldType === FieldType.Select && (
          <FormHorizontal state={scopedState.propertyValueId} name="Value">
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
      </FormGroup>
      <div className="absolute -top-3 -left-3">
        <Button onClick={() => scopedState.set(none)} icon={<DeleteIcon />} style={ButtonStyle.ERROR} />
      </div>
    </div>
  );
}

function AddProperty({
  state,
  performable,
}: {
  state: State<ProviderWritePerformable>;
  performable: VendorPerformablesQuery['vendor']['performables'][0];
}) {
  const scopedState = useState(state);
  const [show, setShow] = React.useState(false); // eslint-disable-line import/no-named-as-default-member

  const properties = performable.properties;

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

function Performable({
  state,
  added,
}: {
  state: State<ProviderWritePerformable>;
  added: State<ProviderWritePerformable>;
}) {
  const scopedState = useState(state);
  const scopedAdded = useState(added);

  const { vendorId } = useParams();
  const { vendor } = useQueryHook(VendorPerformablesDocument, { vendorId }, 'cache-and-network');

  const performable = vendor.performables.find((perf) => perf.id === scopedState.performableId.get());

  let overrides = <div>Property overrides are not available for the selected {performable.type.toLowerCase()}.</div>;

  if (performable.properties.length > 0) {
    overrides = (
      <>
        {state.properties.map((prop) => (
          <PerformableProperty
            key={prop.propertyId.get()}
            state={prop}
            property={performable.properties.find((p) => p.id === prop.propertyId.get())}
            added={scopedAdded}
          />
        ))}
        <AddProperty state={state} performable={performable} />
      </>
    );
  }

  return (
    <div className="relative round shadow" key={performable.id}>
      <div className="flex items-stretch">
        <div className="round-l bg-content flex-1 p">
          <FormGroup plain>
            <FormHorizontal state={scopedState.performableId} name="Type">
              {performable.internalName || performable.name}
            </FormHorizontal>
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
        <div
          className={`flex-1 round-r space-y bg-accent p flex flex-col ${
            state.properties.length > 0 ? 'items-stretch' : 'items-center'
          } justify-center`}
        >
          {overrides}
        </div>
      </div>

      <div className="absolute -top-3 -left-3">
        <Button onClick={() => scopedState.set(none)} icon={<DeleteIcon />} style={ButtonStyle.ERROR} />
      </div>
    </div>
  );
}

function AddPerformable({ state, type }: { type: PerformableType; state: State<ProviderWrite> }) {
  const scopedState = useState(state);
  const [show, setShow] = React.useState(false); // eslint-disable-line import/no-named-as-default-member

  const { vendorId } = useParams();
  const { vendor } = useQueryHook(VendorPerformablesDocument, { vendorId }, 'cache-and-network');

  const added = scopedState.performables.get().map((perf) => perf.performableId);
  const performables = vendor.performables.filter((perf) => perf.type === type && !added.includes(perf.id));

  if (performables.length === 0) {
    return <></>;
  }

  return (
    <div>
      <Slidebar show={show} onClose={() => setShow(false)}>
        <SlidebarHeader title="Choose one" />
        <SlidebarContent>
          <Card>
            <div className="divide-y divide-content">
              {performables.map((p) => {
                const add = () => {
                  scopedState.performables.merge([
                    {
                      performableId: p.id,
                      properties: [],
                    },
                  ]);

                  setShow(false);
                };

                return (
                  <div onClick={add} className="p-2 hover:bg-hover cursor-pointer" key={p.id}>
                    {p.internalName || p.name}
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

export default function VendorSettingProviderPerformable({
  state,
  type,
}: {
  name: string;
  state: State<ProviderWrite>;
  type: PerformableType;
}) {
  const scopedState = useState(state);
  const { vendorId } = useParams();
  const { vendor } = useQueryHook(VendorPerformablesDocument, { vendorId }, 'cache-and-network');

  const performables = vendor.performables.filter((p) => p.type === type).map((p) => p.id);
  const filtered = scopedState.performables.filter((p) => performables.includes(p.performableId.get()));

  return filtered.length === 0 ? (
    <div className="space-y">
      <Card>This provider does not have a {type.toLowerCase()} assigned.</Card>
      <AddPerformable state={state} type={type} />
    </div>
  ) : (
    <FormGroups>
      <>
        {filtered.map((p, index) => (
          <Performable state={p} key={p.performableId.get()} added={scopedState.performables[index]} />
        ))}
        <AddPerformable state={state} type={type} />
      </>
    </FormGroups>
  );
}
