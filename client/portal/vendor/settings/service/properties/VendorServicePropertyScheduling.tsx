import { State, useState } from '@hookstate/core';
import { Tab } from 'client/global/components/tailwind/Tabs';
import * as React from 'react';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormNumber from 'shared/components/form/FormNumber';
import FormSelect from 'shared/components/form/FormSelect';
import { FieldType, PerformablePropertyWrite, RuleAdjustment } from 'shared/generated';
import { Validation } from 'shared/utilities/Validation';

export default function VendorServicePropertyScheduling(state: State<PerformablePropertyWrite>): Tab {
  const scopedState = useState(state);

  let onsiteDescription = '';
  let onsiteEnabled = true;

  if (state.fieldType.get() === FieldType.Select) {
    if (state.values.some((v) => v.onsite.get() > 0)) {
      onsiteEnabled = false;
      onsiteDescription = 'The onsite time of this service is adjusted based upon the value selected by the user.';
    } else {
      onsiteDescription = 'The onsite time of this service is adjusted if any value is selected.';
    }
  } else if (state.fieldType.get() === FieldType.Number) {
    if (state.quantity.get()) {
      onsiteDescription = 'The onsite time of this service is adjusted by multiplying the quantity entered.';
    } else {
      onsiteDescription = 'The onsite time of this service is adjusted if a value greater than zero is provided.';
    }
  } else if ([FieldType.Multi, FieldType.Single].includes(state.fieldType.get())) {
    onsiteDescription = 'The onsite time of this service is adjusted if any non-blank value is provided.';
  } else if (state.fieldType.get() === FieldType.Boolean) {
    onsiteDescription = 'The onsite time of this service is adjusted if this property is enabled.';
  } else if (state.fieldType.get() === FieldType.Repeat) {
    onsiteDescription = 'The onsite time of this service is adjusted if at least one value is provided.';
  }

  return {
    key: 'pscheduling',
    name: 'Scheduling',
    useElement: (
      <FormGroup>
        <FormHorizontal state={scopedState.onsite} name="Onsite" description={onsiteDescription}>
          <FormNumber state={scopedState.onsite} disabled={!onsiteEnabled} />
        </FormHorizontal>
        {scopedState.onsite.get() > 0 && (
          <FormHorizontal state={scopedState.onsiteType} name="Onsite Adjustment">
            <FormSelect
              state={scopedState.onsiteType}
              options={[
                {
                  value: RuleAdjustment.AdjustFlat,
                  label: 'Add to on-site time',
                },
                {
                  value: RuleAdjustment.OverrideTotal,
                  label: 'Override total on-site time',
                },
                {
                  value: RuleAdjustment.OverrideBase,
                  label: 'Override base on-site time',
                },
              ]}
            />
          </FormHorizontal>
        )}
      </FormGroup>
    ),
    error: () => !Validation(scopedState).valid(false, ['onsite', 'onsiteType']),
  };
}
