import { State, useState } from '@hookstate/core';
import { FORM_FIELD_TYPE } from 'client/const';
import * as React from 'react';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormNumber from 'shared/components/form/FormNumber';
import FormSelect from 'shared/components/form/FormSelect';
import FormSwitch from 'shared/components/form/FormSwitch';
import FormText from 'shared/components/form/FormText';
import { FieldLifecycle, FieldRole, FieldType, PerformablePropertyWrite, Visibility } from 'shared/generated';
import { ValidationAttach } from 'shared/utilities/Validation';

export default function VendorServicePropertyGeneral({ state }: { state: State<PerformablePropertyWrite> }) {
  const scopedState = useState(state);

  const metadata = JSON.parse(scopedState.metadata.get() || '{}');

  const date = useState({
    cutoff: metadata.cutoff as string,
    weekends: metadata.weekends as boolean,
    leadTime: metadata.leadTime as number,
    requested: metadata.requested as boolean,
  });

  ValidationAttach(date);

  const onDateChange = () => {
    scopedState.metadata.set(
      JSON.stringify({
        cutoff: date.cutoff.get(),
        weekends: date.weekends.get(),
        requested: date.requested.get(),
        leadTime: date.leadTime.get(),
      })
    );
  };

  const bool = useState({
    ack: metadata.ack as string,
  });

  ValidationAttach(bool);

  return (
    <FormGroup>
      <FormHorizontal state={scopedState.name} name="Name">
        <FormText state={scopedState.name} />
      </FormHorizontal>
      <FormHorizontal
        state={scopedState.shortName}
        name="Short Name"
        description="When set, will override the short name defined on the service."
      >
        <FormText state={scopedState.shortName} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.fieldType} name="Field Type">
        <FormSelect state={scopedState.fieldType} options={FORM_FIELD_TYPE} disabled />
      </FormHorizontal>
      {scopedState.fieldType.get() === FieldType.Boolean && (
        <>
          <FormHorizontal
            state={bool.ack}
            name="Acknowledge"
            description="If a message is provided, the customer must acknowledge (via a checkbox) the message before they can continue."
          >
            <FormText
              state={bool.ack}
              lines={4}
              onChange={() => scopedState.metadata.set(JSON.stringify({ ack: bool.ack.get() }))}
            />
          </FormHorizontal>
        </>
      )}
      {scopedState.fieldType.get() === FieldType.Date && (
        <>
          <FormHorizontal
            state={date.requested}
            name="After Requested Time"
            description="If enabled, the customer must select a date at least one day ahead of the earliest requested appointment date."
          >
            <FormSwitch state={date.requested} onChange={onDateChange} />
          </FormHorizontal>
          <FormHorizontal
            state={date.weekends}
            name="Include Weekends"
            description="If enabled, the customer will be able to select any date that falls on a Saturday or Sunday."
          >
            <FormSwitch state={date.weekends} onChange={onDateChange} />
          </FormHorizontal>
          <FormHorizontal
            state={date.cutoff}
            name="Cut Off"
            description="The time (inclusive) after which the current day is unselectable."
          >
            <FormText state={date.cutoff} type="time" onChange={onDateChange} />
          </FormHorizontal>
          <FormHorizontal
            state={date.leadTime}
            name="Lead Time"
            description="The number of business days from today (inclusive) to exclude from selection."
          >
            <FormNumber state={date.leadTime} onChange={onDateChange} />
          </FormHorizontal>
        </>
      )}
      <FormHorizontal state={scopedState.role} name="Role">
        <FormSelect
          state={scopedState.role}
          options={[
            { label: 'Job', value: FieldRole.Job },
            { label: 'Deliverable', value: FieldRole.Deliverable },
          ]}
        />
      </FormHorizontal>
      <FormHorizontal state={scopedState.lifecycle} name="Lifecycle">
        <FormSelect
          state={scopedState.lifecycle}
          options={[
            { label: 'Save', value: FieldLifecycle.Save },
            { label: 'Accept', value: FieldLifecycle.Accept },
            { label: 'Create', value: FieldLifecycle.Create },
            { label: 'Reject', value: FieldLifecycle.Reject },
            { label: 'Submission', value: FieldLifecycle.Submission },
            { label: 'Update', value: FieldLifecycle.Update },
          ]}
        />
      </FormHorizontal>
      <FormHorizontal
        state={scopedState.requiredCreation}
        name="Required"
        description="When enabled, will force the user to provide a value during order creation."
      >
        <FormSwitch state={scopedState.requiredCreation} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.visibility} name="Visibility">
        <FormSelect
          state={scopedState.visibility}
          options={[
            { value: Visibility.External, label: 'Allow Buyer Selection' },
            { value: Visibility.Internal, label: 'Internal Option Only' },
          ]}
        />
      </FormHorizontal>
    </FormGroup>
  );
}
