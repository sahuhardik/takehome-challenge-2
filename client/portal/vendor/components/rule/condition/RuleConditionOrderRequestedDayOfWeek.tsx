import ConditionDayOfWeek from 'client/global/components/condition/ConditionDayOfWeek';
import { ConditionComponent } from 'client/portal/vendor/components/rule/condition/common';
import * as React from 'react';
import { ConditionComparator, ConditionType } from 'shared/generated';
import DayIcon from 'shared/icons/DayIcon';

const RuleConditionOrderRequestedDayOfWeek: ConditionComponent<'orderRequestedDayOfWeek'> = {
  title: 'Order Requested: Day of Week',
  icon: DayIcon,
  type: ConditionType.ORDER_REQUESTED_DOW,
  preventLockedRemove: false,
  description:
    'Based upon one of the requested appointment times, filter where the day of the week is one of the selected options.',
  example:
    'Charge an additional fee if customer is requesting an appointment be scheduled on weekend, weekdays or a holiday.',
  key: 'orderRequestedDayOfWeek',
  component(state) {
    return <ConditionDayOfWeek state={state} name="appointment was requested" />;
  },
  partial: () => ({
    days: [],
    holidays: [],
    comparator: ConditionComparator.Equals,
  }),
  validate(validator) {
    validator.when((v) => v.days.length === 0).holidays.required();
    validator.when((v) => v.holidays.length === 0).days.required();
  },
};

export default RuleConditionOrderRequestedDayOfWeek;
