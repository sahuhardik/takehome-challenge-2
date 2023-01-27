import ConditionTime from 'client/global/components/condition/ConditionTime';
import { ConditionComponent } from 'client/portal/vendor/components/rule/condition/common';
import * as React from 'react';
import { ConditionType } from 'shared/generated';
import TimeIcon from 'shared/icons/TimeIcon';

const RuleConditionOrderTime: ConditionComponent<'orderTime'> = {
  title: 'Order: Time of Day',
  icon: TimeIcon,
  type: ConditionType.ORDER_TIME,
  preventLockedRemove: false,
  description:
    'Based upon the creation date of an order, filter where the time of day is between, before or after a set value.',
  example: 'Prevent a user from selecting same-day service if they are placing an order after 12:00 PM.',
  key: 'orderTime',
  component(state) {
    return <ConditionTime state={state} name="order was created" />;
  },
  partial: () => ({}),
  validate(validator) {
    validator.validate((m) => !!m.start && !!m.stop);
  },
};

export default RuleConditionOrderTime;
