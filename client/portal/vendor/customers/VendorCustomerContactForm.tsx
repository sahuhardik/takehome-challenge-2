import { none, State, useState } from '@hookstate/core';
import { isPhoneNumber } from 'class-validator';
import { SlidebarCloseButton, SlidebarOpenLink } from 'client/global/components/button/SlidebarOpenButton';
import FormPhone from 'client/global/components/form/FormPhone';
import { LinkStyle } from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { SlidebarContent, SlidebarFooter, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import * as React from 'react';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSwitch from 'shared/components/form/FormSwitch';
import FormText from 'shared/components/form/FormText';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { ContactUser } from 'shared/generated';
import AddIcon from 'shared/icons/AddIcon';
import DeleteIcon from 'shared/icons/DeleteIcon';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';
import validator from 'validator';

const isEmail = validator.isEmail;

export function ContactSlidebar({ listState }: { listState: State<ContactUser[]> }) {
  const scopedState = useState(listState);
  const state = useState({
    first: null as string,
    last: null as string,
    isDefault: false,
    phone: null as string,
    email: null as string,
  });

  const handleReset = () => {
    state.set({
      first: '',
      last: '',
      isDefault: false,
      phone: '',
      email: '',
    });
  };

  const handleAdd = () => {
    scopedState.merge([Object.assign({}, state.get())]);
    handleReset();
  };

  validate(state, scopedState);

  return (
    <>
      <SlidebarHeader title="Add Contact" />
      <SlidebarContent>
        <FormGroup>
          <FormHorizontal state={state.first} name="First">
            <FormText key={`first-${scopedState.get().length}`} state={state.first} placeholder={'John'} />
          </FormHorizontal>
          <FormHorizontal state={state.last} name="Last">
            <FormText key={`last-${scopedState.get().length}`} state={state.last} placeholder={'Doe'} />
          </FormHorizontal>
          <FormHorizontal state={state.phone} name="Phone Number">
            <FormPhone key={`phone-${scopedState.get().length}`} state={state.phone} />
          </FormHorizontal>
          <FormHorizontal state={state.email} name="E-mail Address">
            <FormText key={`email-${scopedState.get().length}`} state={state.email} placeholder={'john_doe@aol.com'} />
          </FormHorizontal>
        </FormGroup>
      </SlidebarContent>
      <SlidebarFooter>
        <div className="text-right">
          <Button onClick={handleReset} style={ButtonStyle.QUIET}>
            Clear
          </Button>
          <SlidebarCloseButton onClick={handleAdd} disabled={!Validation(state).valid(true)} snackbar={false}>
            Add
          </SlidebarCloseButton>
        </div>
      </SlidebarFooter>
    </>
  );
}

export function ContactTableBody({ state, isCustomerForm }: { state: State<ContactUser[]>; isCustomerForm?: boolean }) {
  const handleRemove = (index: number) => {
    state[index].set(none);
  };

  return (
    <TableBody>
      <TableRow>
        <TableCell>
          <SlidebarOpenLink style={LinkStyle.BOLD} icon={<AddIcon />} text="Add Contact">
            <ContactSlidebar listState={state} />
          </SlidebarOpenLink>
        </TableCell>
      </TableRow>
      {state.get().length ? (
        state.get().map(({ email, first, last, phone }, index) => (
          <TableRow key={index}>
            <TableCell>{`${first} ${last}`}</TableCell>
            <TableCell className="text-center">{phone || <div className="text-gray-400">-</div>}</TableCell>
            <TableCell className="text-center">{email || <div className="text-gray-400">-</div>}</TableCell>
            {!isCustomerForm && (
              <TableCell className="text-center">
                <FormSwitch state={state[index].isDefault} />
              </TableCell>
            )}
            <TableCell className="text-right">
              <Button style={ButtonStyle.DANGER} onClick={() => handleRemove(index)} icon={<DeleteIcon />} />
            </TableCell>
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={3}>No CC e-mail addresses provided.</TableCell>
        </TableRow>
      )}
    </TableBody>
  );
}

export function VendorCustomerContactForm({
  state,
  isCustomerForm,
}: {
  state: State<ContactUser[]>;
  isCustomerForm?: boolean;
}) {
  return (
    <Table className="pt-4">
      <TableHead>
        <TableRow>
          <TableHeadCell>CC To</TableHeadCell>
          <TableHeadCell />
          <TableHeadCell />
          {!isCustomerForm && (
            <TableHeadCell className="text-center">{state.get().length ? 'Default?' : ''}</TableHeadCell>
          )}
          <TableHeadCell />
        </TableRow>
      </TableHead>
      <ContactTableBody state={state} isCustomerForm={isCustomerForm} />
    </Table>
  );
}

const validate = (inputState: State<ContactUser>, scopedState: State<ContactUser[]>) => {
  ValidationAttach(inputState, (validator) => {
    validator.first.required('A first name must be provided.');
    validator.last.required('A last name must be provided.');
    validator.email.required('An e-mail address must be provided.');

    validator.email.validate(
      (value: string) => typeof value === 'string' && isEmail(value),
      'This e-mail address is invalid.'
    );

    validator.phone.validate((value) => isPhoneNumber(value, 'US'), 'Please provide a valid 10-digit US phone number.');

    validator.phone.validate(
      (value: string) =>
        typeof value === 'string' &&
        value.length &&
        !scopedState.get().some((item) => item.phone !== null && item.phone === value),
      'This phone number already exists below'
    );

    validator.email.validate(
      (value: string) =>
        typeof value === 'string' &&
        !scopedState.get().some((item) => item.email !== null && item.email.toLowerCase() === value.toLowerCase()),
      'This e-mail already exists below'
    );
  });
  ValidationAttach(scopedState, (validator) => validator.isDefault);
};
