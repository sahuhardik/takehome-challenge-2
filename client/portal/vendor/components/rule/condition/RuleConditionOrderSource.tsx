import ConditionOrderSource from 'client/global/components/condition/ConditionOrderSource';
import { ConditionComponent } from 'client/portal/vendor/components/rule/condition/common';
import * as React from 'react';
import { ConditionComparator, ConditionType } from 'shared/generated';
import ServicesIcon from 'shared/icons/ServicesIcon';

const RuleConditionOrderSource: ConditionComponent<'orderSource'> = {
  title: 'Order: Source',
  icon: ServicesIcon,
  type: ConditionType.ORDER_SOURCE,
  preventLockedRemove: false,
  description: 'Only execute this rule on orders which were created from a particular source.',
  example: 'Only apply discounts when a customer creates an order, but ignore for orders created by the internal team.',
  key: 'orderSource',
  component(state) {
    return <ConditionOrderSource state={state} />;
  },
  partial: () => ({ comparator: ConditionComparator.Equals }),
  validate(validator) {
    validator.source.required();
    validator.comparator.required();
  },
};

export default RuleConditionOrderSource;
