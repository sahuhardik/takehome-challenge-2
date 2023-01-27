import ConditionField from 'client/global/components/condition/ConditionField';
import { ConditionComponent, fieldPartial, fieldValidate } from 'client/portal/vendor/components/rule/condition/common';
import * as React from 'react';
import { ConditionType, FieldRole } from 'shared/generated';
import PropertiesIcon from 'shared/icons/PropertiesIcon';

const RuleConditionBuyerField: ConditionComponent<'buyerField'> = {
  title: 'Customer: Field',
  icon: PropertiesIcon,
  type: ConditionType.BUYER_FIELD,
  preventLockedRemove: false,
  description: 'Filter where a buyer custom field is of a certain value.',
  example: 'Apply a discount to services if buyer has a checkbox field selected.',
  key: 'buyerField',
  component(state) {
    return <ConditionField state={state} role={FieldRole.Buyer} />;
  },
  partial: fieldPartial,
  validate: fieldValidate,
};

export default RuleConditionBuyerField;
