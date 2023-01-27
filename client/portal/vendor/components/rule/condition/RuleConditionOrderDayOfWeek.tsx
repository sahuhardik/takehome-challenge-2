import ConditionDayOfWeek from 'client/global/components/condition/ConditionDayOfWeek';
import { ConditionComponent } from 'client/portal/vendor/components/rule/condition/common';
import * as React from 'react';
import { ConditionComparator, ConditionType } from 'shared/generated';
import DayIcon from 'shared/icons/DayIcon';

const RuleConditionOrderDayOfWeek: ConditionComponent<'orderDayOfWeek'> = {
  title: 'Order: Day of Week',
  icon: DayIcon,
  type: ConditionType.ORDER_DOW,
  preventLockedRemove: false,
  description:
    'Based upon the creation date of an order, filter where the day of the week is one of the selected options.',
  example:
    'Prevent a user from selecting next-day service if they are placing an order on a Friday and you are closed on the weekend.',
  key: 'orderDayOfWeek',
  component(state) {
    return <ConditionDayOfWeek state={state} name="order was created" />;
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

export default RuleConditionOrderDayOfWeek;
