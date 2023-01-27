import ConditionTime from 'client/global/components/condition/ConditionTime';
import { ConditionComponent } from 'client/portal/vendor/components/rule/condition/common';
import * as React from 'react';
import { ConditionType } from 'shared/generated';
import TimeIcon from 'shared/icons/TimeIcon';

const RuleConditionOrderRequestedTime: ConditionComponent<'orderRequestedTime'> = {
  title: 'Order Requested: Time of Day',
  icon: TimeIcon,
  type: ConditionType.ORDER_REQUESTED_TIME,
  preventLockedRemove: false,
  description:
    'Based upon one of the requested appointment times, filter where the time of day is between, before or after a set value.',
  example:
    'Charge an additional fee if customer is requesting an appointment be scheduled outside of standard business hours.',
  key: 'orderRequestedTime',
  component(state) {
    return <ConditionTime state={state} name="appointment was requested" />;
  },
  partial: () => ({}),
  validate(validator) {
    validator.validate((m) => !!m.start && !!m.stop);
  },
};

export default RuleConditionOrderRequestedTime;
