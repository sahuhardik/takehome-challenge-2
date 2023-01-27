import ConditionDayOfWeek from 'client/global/components/condition/ConditionDayOfWeek';
import { ConditionComponent } from 'client/portal/vendor/components/rule/condition/common';
import * as React from 'react';
import { ConditionComparator, ConditionType } from 'shared/generated';
import DayIcon from 'shared/icons/DayIcon';

const RuleConditionAppointmentDayOfWeek: ConditionComponent<'appointmentDayOfWeek'> = {
  title: 'Appointment: Day of Week',
  icon: DayIcon,
  type: ConditionType.APPOINTMENT_DOW,
  preventLockedRemove: false,
  description:
    'Based upon the scheduled date of an appointment, filter where the day of the week is one of the selected options.',
  example: 'Charge an additional fee if customer is trying to book an appointment on weekend, weekdays or a holiday.',
  key: 'appointmentDayOfWeek',
  component(state) {
    return <ConditionDayOfWeek state={state} name="appointment was scheduled" />;
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

export default RuleConditionAppointmentDayOfWeek;
