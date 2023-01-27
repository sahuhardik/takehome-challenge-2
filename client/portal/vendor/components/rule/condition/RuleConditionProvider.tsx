import ConditionProvider from 'client/global/components/condition/ConditionProvider';
import { ConditionComponent } from 'client/portal/vendor/components/rule/condition/common';
import * as React from 'react';
import { ConditionComparator, ConditionProviderMetadata, ConditionType } from 'shared/generated';
import PropertiesIcon from 'shared/icons/PropertiesIcon';
import { DetectValidator } from 'shared/utilities/Validation';

const RuleConditionProvider: ConditionComponent<'provider'> = {
  title: 'Assigned Provider',
  icon: PropertiesIcon,
  type: ConditionType.PROVIDER,
  preventLockedRemove: false,
  description: 'Filter where a provider has been assigned to a job.',
  example: 'Adjust the providers payout for particular services.',
  key: 'provider',
  component(state) {
    return <ConditionProvider state={state} />;
  },
  partial: () => ({
    providerMemberId: null as never,
    comparator: ConditionComparator.Equals,
  }),
  validate(validator: DetectValidator<ConditionProviderMetadata>) {
    validator.comparator.required();
    validator.providerMemberId.required();
  },
};

export default RuleConditionProvider;
