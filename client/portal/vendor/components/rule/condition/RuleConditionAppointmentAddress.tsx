import ConditionPostals from 'client/global/components/condition/ConditionPostals';
import { addressValidate, ConditionComponent } from 'client/portal/vendor/components/rule/condition/common';
import * as React from 'react';
import { ConditionComparator, ConditionType } from 'shared/generated';
import AddressIcon from 'shared/icons/AddressIcon';

const RuleConditionAppointmentAddress: ConditionComponent<'appointmentAddress'> = {
  title: 'Address: Appointment',
  icon: AddressIcon,
  type: ConditionType.APPOINTMENT_ADDRESS,
  preventLockedRemove: false,
  description: 'Filter where the service address matches the configured options.',
  example: 'Charge a travel fee if the service address is outside of the normal working area.',
  key: 'appointmentAddress',
  component(state) {
    return <ConditionPostals state={state} name="appointment" />;
  },
  partial: () => ({
    comparator: ConditionComparator.Equals,
    postals: [],
  }),
  validate: addressValidate,
};

export default RuleConditionAppointmentAddress;
