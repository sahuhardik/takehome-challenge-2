import ConditionField from 'client/global/components/condition/ConditionField';
import { ConditionComponent, fieldPartial, fieldValidate } from 'client/portal/vendor/components/rule/condition/common';
import * as React from 'react';
import { ConditionType, FieldRole } from 'shared/generated';
import PropertiesIcon from 'shared/icons/PropertiesIcon';

const RuleConditionOrderField: ConditionComponent<'orderField'> = {
  title: 'Order: Custom Field',
  icon: PropertiesIcon,
  type: ConditionType.ORDER_FIELD,
  preventLockedRemove: false,
  description: 'Filter where a custom order field is of a certain value.',
  example:
    'If the buyer creates an order for a house whose square feet exceeds a certain limit, add an additional charge.',
  key: 'orderField',
  component(state) {
    return <ConditionField state={state} role={FieldRole.Order} />;
  },
  partial: fieldPartial,
  validate: fieldValidate,
};

export default RuleConditionOrderField;
