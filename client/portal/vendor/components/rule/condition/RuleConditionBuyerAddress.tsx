import ConditionPostals from 'client/global/components/condition/ConditionPostals';
import { addressValidate, ConditionComponent } from 'client/portal/vendor/components/rule/condition/common';
import * as React from 'react';
import { ConditionComparator, ConditionType } from 'shared/generated';
import AddressIcon from 'shared/icons/AddressIcon';

const RuleConditionBuyerAddress: ConditionComponent<'buyerAddress'> = {
  title: 'Customer: Address',
  icon: AddressIcon,
  type: ConditionType.BUYER_ADDRESS,
  preventLockedRemove: false,
  description: 'Filter where the buyer address matches the configured options.',
  example: 'Charge the buyer a different tax rate based upon where they live.',
  key: 'buyerAddress',
  component(state) {
    return <ConditionPostals state={state} name="buyer" />;
  },
  partial: () => ({
    comparator: ConditionComparator.Equals,
    postals: [],
  }),
  validate: addressValidate,
};

export default RuleConditionBuyerAddress;
