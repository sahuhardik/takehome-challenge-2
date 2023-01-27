import { none, State, useState } from '@hookstate/core';
import SlidebarOpenButton, {
  SlidebarCloseButton,
  SlidebarOpenLink,
} from 'client/global/components/button/SlidebarOpenButton';
import Sortable from 'client/global/components/Sortable';
import Card from 'client/global/components/tailwind/Card';
import { Tab } from 'client/global/components/tailwind/Tabs';
import { SlidebarContent, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import * as React from 'react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  ConditionComparator,
  VendorWizardSupplementalDocument,
  VendorWizardSupplementalQuery,
  WizardPageConditionWrite,
  WizardPageWrite,
} from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import DeleteIcon from 'shared/icons/DeleteIcon';
import EditIcon from 'shared/icons/EditIcon';
import MoveIcon from 'shared/icons/MoveIcon';
import { Validation } from 'shared/utilities/Validation';
import { v4 } from 'uuid';

type Vendor = VendorWizardSupplementalQuery['vendor'];

function Form({ page, vendor }: { page: State<WizardPageWrite>; vendor: Vendor }) {
  const state = useState(page);

  const selectedService = state.performableId.get();
  const properties = selectedService
    ? vendor.performables.find((p) => p.id === selectedService).properties.map((p) => ({ value: p.id, label: p.name }))
    : [];

  return (
    <>
      <FormGroup>
        <FormHorizontal state={state.performableId} name="Service">
          <FormSelect
            state={state.performableId}
            onChange={() => state.propertyId.set(none)}
            options={vendor.performables.map((p) => ({ value: p.id, label: p.internalName || p.name }))}
          />
        </FormHorizontal>
        <FormHorizontal state={state.propertyId} name="Property">
          <FormSelect
            state={state.propertyId}
            disabled={properties.length === 0}
            options={properties}
            placeholder={
              state.performableId.get()
                ? properties.length === 0
                  ? 'No properties available'
                  : 'Optionally choose a property'
                : 'Select a service'
            }
          />
        </FormHorizontal>
      </FormGroup>
      <div className="pt">
        <div className="flex w-full justify-between items-center">
          <div className="text-lg font-semibold">Conditions</div>

          <Button
            style={ButtonStyle.SECONDARY}
            onClick={() => {
              state.conditions.merge([{} as WizardPageConditionWrite]);
            }}
          >
            Add Condition
          </Button>
        </div>
      </div>
      <div className="space-y pt">
        {state.conditions.length == 0 && <Card>No conditions have been added.</Card>}
        {state.conditions.map((condition, index) => {
          const conditionService = condition.performableId.get();

          const conditionProperties = conditionService
            ? vendor.performables
                .find((p) => p.id === conditionService)
                .properties.map((p) => ({ value: p.id, label: p.name }))
            : [];

          return (
            <FormGroup key={index} onRemove={() => condition.set(none)}>
              <FormHorizontal state={condition.performableId} name="Service">
                <FormSelect
                  state={condition.performableId}
                  onChange={() => condition.propertyId.set(none)}
                  options={vendor.performables.map((p) => ({ value: p.id, label: p.name }))}
                />
              </FormHorizontal>
              <FormHorizontal state={condition.propertyId} name="Property">
                <FormSelect
                  state={condition.propertyId}
                  placeholder={
                    condition.performableId.get()
                      ? conditionProperties.length === 0
                        ? 'No properties available'
                        : 'Optionally choose a property'
                      : 'Select a service'
                  }
                  disabled={conditionProperties.length === 0}
                  options={conditionProperties}
                />
              </FormHorizontal>
              <FormHorizontal state={condition.comparator} name="Check">
                <FormSelect
                  state={condition.comparator}
                  options={[
                    {
                      label: 'Exists',
                      value: ConditionComparator.Exists,
                    },
                    {
                      label: 'Does Not Exist',
                      value: ConditionComparator.NotExists,
                    },
                  ]}
                />
              </FormHorizontal>
            </FormGroup>
          );
        })}
        <SlidebarCloseButton disabled={!Validation(state).valid(true)}>Finish</SlidebarCloseButton>
      </div>
    </>
  );
}

function Page({ pages, index, vendor }: { vendor: Vendor; pages: State<WizardPageWrite[]>; index: number }) {
  const state = useState(pages[index]);

  const performable = vendor.performables.find((p) => p.id === state.performableId.get());

  useEffect(() => {
    if (state.performableId?.get() && !performable) {
      // TODO: smell, prevent this bad state
      state.set(none);
    }
  }, [performable, state]);

  if (!performable) {
    return <></>;
  }

  let name = <>{performable.name}</>;

  const property = performable.properties.find((p) => p.id === state.propertyId.get());

  if (property) {
    name = (
      <span>
        {performable.name}: <i>{property.name}</i>
      </span>
    );
  }

  return (
    <Sortable index={index} state={pages}>
      <div className="bg-content round shadow p-4 flex items-center">
        <div className="w-4 h-4 mr-2 cursor-move">
          <MoveIcon />
        </div>
        <div className="flex-1">
          <SlidebarOpenLink text={name} icon={<EditIcon />}>
            <SlidebarHeader title="Edit Page" />
            <SlidebarContent>
              <Form page={state} vendor={vendor} />
            </SlidebarContent>
          </SlidebarOpenLink>
        </div>
        <Button
          style={ButtonStyle.DANGER}
          onClick={(e) => {
            e.preventDefault();

            state.set(none);
          }}
          icon={<DeleteIcon />}
        />
      </div>
    </Sortable>
  );
}

export default function VendorSettingsWizardEdit(pages: State<WizardPageWrite[]>): Tab {
  const { vendorId } = useParams();
  const { vendor } = useQueryHook(VendorWizardSupplementalDocument, { vendorId });

  return {
    name: 'Pages',
    key: 'pages',
    useActions: [
      <SlidebarOpenButton
        key="add"
        button="Add Page"
        onClose={(cancel) => cancel && pages[pages.length - 1].set(none)}
        onClick={() => {
          pages.merge([
            {
              id: v4(),
              order: pages.length,
              conditions: [],
            } as WizardPageWrite,
          ]);
        }}
      >
        <SlidebarHeader title="Create Page" />
        <SlidebarContent>
          <Form vendor={vendor} page={pages[pages.length - 1]} />
        </SlidebarContent>
      </SlidebarOpenButton>,
    ],
    useElement: (
      <div className="space-y-2">
        {pages.map((page, index) => (
          <Page pages={pages} index={index} vendor={vendor} key={page.id.get()} />
        ))}
      </div>
    ),
  };
}
