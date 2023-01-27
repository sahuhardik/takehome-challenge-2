import { State, useState } from '@hookstate/core';
import { isPhoneNumber } from 'class-validator';
import { createContext } from 'react';
import { UserWrite } from 'shared/generated';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

export type VendorUsersState = State<UserWrite>;

export class VendorUsersValidator {
  constructor(private state: VendorUsersState) {
    ValidationAttach(state, (validator) => {
      validator.first.required();
      validator.last.required();
      validator.email.required();
      validator.phone.validate(
        (value) => isPhoneNumber(value, 'US'),
        'Please provide a valid 10-digit US phone number.'
      );
    });
  }

  valid() {
    return Validation(useState(this.state)).valid(true); // eslint-disable-line react-hooks/rules-of-hooks
  }
}

export const VendorUsersValidatorContext = createContext<VendorUsersValidator>(null);
export const VendorUsersContext = createContext<VendorUsersState>(null);
