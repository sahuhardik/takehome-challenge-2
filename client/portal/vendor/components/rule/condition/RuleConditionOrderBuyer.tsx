import ConditionBuyer from 'client/global/components/condition/ConditionBuyer';
import { ConditionComponent } from 'client/portal/vendor/components/rule/condition/common';
import * as React from 'react';
import { ConditionType } from 'shared/generated';
import ServicesIcon from 'shared/icons/ServicesIcon';

const RuleConditionOrderBuyer: ConditionComponent<'orderBuyer'> = {
  title: 'Order: Buyer',
  icon: ServicesIcon,
  type: ConditionType.ORDER_BUYER,
  preventLockedRemove: true,
  description: 'Only execute this rule on orders which have a particular buyer.',
  example: 'Apply one-off custom pricing to a customer for particular services.',
  key: 'orderBuyer',
  component(state, locked) {
    return <ConditionBuyer state={state} locked={locked} />;
  },
  partial: () => ({ buyerId: [] }),
  validate(validator) {
    validator.buyerId.required();
    validator.comparator.required();
  },
};

export default RuleConditionOrderBuyer;
