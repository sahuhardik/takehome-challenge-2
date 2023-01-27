import ConditionPerformable from 'client/global/components/condition/ConditionPerformable';
import {
  ConditionComponent,
  fieldValidate,
  performablePartial,
} from 'client/portal/vendor/components/rule/condition/common';
import * as React from 'react';
import { ConditionType } from 'shared/generated';
import ServicesIcon from 'shared/icons/ServicesIcon';

const RuleConditionOrderPerformable: ConditionComponent<'orderPerformable'> = {
  title: 'Order: Contains Service',
  icon: ServicesIcon,
  type: ConditionType.ORDER_PERFORMABLE,
  preventLockedRemove: false,
  description: 'Filter when a order contains (or not) a service or a service field is configured a certain way.',
  example: 'Simulate "packages" by applying a discount if the order contains multiple services.',
  key: 'orderPerformable',
  component(state) {
    return (
      <ConditionPerformable
        state={state}
        exists="When the order contains"
        notExists="When the order does not contain"
      />
    );
  },
  partial: performablePartial,
  validate(validator) {
    validator.performableId.required();
    validator.existence.required();

    const field = validator.when((v) => !!v.field.fieldId?.get()).field;

    fieldValidate(field);
  },
};

export default RuleConditionOrderPerformable;
