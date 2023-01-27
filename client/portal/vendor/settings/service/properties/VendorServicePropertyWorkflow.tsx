import { State, useState } from '@hookstate/core';
import { Tab } from 'client/global/components/tailwind/Tabs';
import * as React from 'react';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSwitch from 'shared/components/form/FormSwitch';
import { FieldType, PerformablePropertyWrite } from 'shared/generated';
import { Validation } from 'shared/utilities/Validation';

export default function VendorServicePropertyWorkflow(state: State<PerformablePropertyWrite>): Tab {
  const scopedState = useState(state);

  let quantity = '';

  if (scopedState.fieldType.get() === FieldType.Select) {
    quantity =
      'Require the provider submit the exact number of deliverables as defined in each select option (quantity).';
  } else if (scopedState.fieldType.get() === FieldType.Number) {
    quantity = 'Require the provider submit the exact number of deliverables specified by this property value.';
  }

  return {
    key: 'pworkflow',
    name: 'Workflow',
    useElement: (
      <FormGroup>
        <FormHorizontal
          state={scopedState.allowChange}
          name="Allow Change"
          description="Give providers the ability to change the value of this property at any time."
        >
          <FormSwitch state={scopedState.allowChange} />
        </FormHorizontal>
        {quantity && (
          <FormHorizontal state={scopedState.quantity} name="Quantity" description={quantity}>
            <FormSwitch state={scopedState.quantity} />
          </FormHorizontal>
        )}
        {!scopedState.requiredCreation.get() && (
          <FormHorizontal
            state={scopedState.requiredSubmission}
            name="Required"
            description="The provider must choose a value before submitting the work as complete."
          >
            <FormSwitch state={scopedState.requiredSubmission} />
          </FormHorizontal>
        )}
      </FormGroup>
    ),
    error: () => !Validation(scopedState).valid(false, ['allowChange', 'quantity', 'requiredSubmission']),
  };
}
