import ConditionTime from 'client/global/components/condition/ConditionTime';
import { ConditionComponent } from 'client/portal/vendor/components/rule/condition/common';
import * as React from 'react';
import { ConditionType } from 'shared/generated';
import TimeIcon from 'shared/icons/TimeIcon';

const RuleConditionAppointmentTime: ConditionComponent<'appointmentTime'> = {
  title: 'Appointment: Time of Day',
  icon: TimeIcon,
  type: ConditionType.APPOINTMENT_TIME,
  preventLockedRemove: false,
  description:
    'Based upon the scheduled time of an appointment, filter where the time of day is between, before or after a set value.',
  example: 'Charge an additional fee for an appointment if the scheduled time is outside of standard business hours.',
  key: 'appointmentTime',
  component(state) {
    return <ConditionTime state={state} name="appointment was scheduled" />;
  },
  partial: () => ({}),
  validate(validator) {
    validator.validate((m) => !!m.start && !!m.stop);
  },
};

export default RuleConditionAppointmentTime;
