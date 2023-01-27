import { useState } from '@hookstate/core';
import { useQueryParams } from 'client/global/NavigationUtil';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormVertical } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { ChangePasswordDocument } from 'shared/generated';
import { useMutationPromise } from 'shared/Graph';
import ChevronRight from 'shared/icons/ChevronRight';
import { ValidationAttach } from 'shared/utilities/Validation';

export default function ChangePassword({ logo }: { logo: React.ReactNode }) {
  const { next } = useQueryParams();
  const changePassword = useMutationPromise(ChangePasswordDocument);
  const navigate = useNavigate();

  const form = useState({
    password: '',
    repeatPassword: '',
  });

  ValidationAttach(form, (validator) => {
    // TODO: shared with other pages
    validator.password.required();
    validator.password.validate((p) => !p || p.length >= 8, 'Your password must be at least 8 characters.');
    validator.password.validate((p) => {
      if (!p) {
        return true;
      }

      const matches = [new RegExp(/[A-Z]/), new RegExp(/[a-z]/), new RegExp(/[0-9]/), new RegExp(/[^A-z0-9]/)].filter(
        (m) => m.test(p)
      );

      return matches.length >= 3;
    }, 'Your password must contain 3 of the following: upper case letters, lower case letters, numbers, or special characters');
    validator.repeatPassword.required();
    validator.repeatPassword.validate(
      (repeatPassword) => form.password.value === repeatPassword,
      "Passwords don't match"
    );
  });

  return (
    <div className="flex-1 w-full h-full flex items-center justify-center bg-theme-body">
      <div className="bg-content border-t-8 border-theme-primary p w-96 shadow flex flex-col items-center round">
        <div className="w-48">{logo}</div>
        <div className="mt w-full">
          <FormGroup plain>
            <FormVertical state={form.password} name="New Password" border={false}>
              <FormText state={form.password} focus type="password" />
            </FormVertical>

            <FormVertical state={form.repeatPassword} name="Repeat New Password" border={false}>
              <FormText state={form.repeatPassword} type="password" />
            </FormVertical>
          </FormGroup>
          <PromiseButton
            snackbar={false}
            style={ButtonStyle.PRIMARY}
            className="mt w-full"
            icon={<ChevronRight />}
            right
            onClick={async () => {
              await changePassword({
                password: form.password.value,
              });

              navigate(String(next), { replace: true });
            }}
            disabled={form}
          >
            Change password
          </PromiseButton>
        </div>
      </div>
    </div>
  );
}
