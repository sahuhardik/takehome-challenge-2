import ConditionPerformable from 'client/global/components/condition/ConditionPerformable';
import {
  ConditionComponent,
  fieldValidate,
  performablePartial,
} from 'client/portal/vendor/components/rule/condition/common';
import * as React from 'react';
import { ConditionType } from 'shared/generated';
import ServicesIcon from 'shared/icons/ServicesIcon';

const RuleConditionPerformable: ConditionComponent<'performable'> = {
  title: 'Is Service',
  icon: ServicesIcon,
  type: ConditionType.PERFORMABLE,
  preventLockedRemove: true,
  description: 'Only execute this rule on jobs which have a particular service.',
  key: 'performable',
  component(state, locked) {
    return (
      <ConditionPerformable
        state={state}
        locked={locked}
        exists="When the service is"
        notExists="When the service is not"
      />
    );
  },
  partial: performablePartial,
  validate(validator) {
    validator.performableId.required();
    validator.existence.required();

    const field = validator.when((v) => !!v.field.fieldId.get()).field;

    fieldValidate(field);
  },
};

export default RuleConditionPerformable;
