import { useState } from '@hookstate/core';
import { isPhoneNumber } from 'class-validator';
import { useRegisterBreadcrumb } from 'client/global/components/BreadcrumbBar';
import FormArrayCheckbox from 'client/global/components/form/FormArrayCheckbox';
import { canEditUser } from 'client/global/components/form/FormUserRoles';
import Center from 'client/global/components/tailwind/Center';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import Toolbar from 'client/global/components/tailwind/Toolbar';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmationButton from 'shared/components/button/ConfirmationButton';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormStringDate from 'shared/components/form/FormStringDate';
import FormText from 'shared/components/form/FormText';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  RoleType,
  VendorInternalUserDeleteDocument,
  VendorInternalUserListDocument,
  VendorInternalUserUpdateDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import { useUser } from 'shared/UserState';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

export default function VendorUserEdit() {
  const { userId, vendorId } = useParams();
  const currentUser = useUser();

  const query = useQueryHook(VendorInternalUserListDocument, { vendorId });

  const {
    user: { id, ...user },
  } = query.vendor.users.find((u) => u.user.id === userId);

  const canEdit = currentUser.superuser || canEditUser(false, user.ownByMyself, user.ownerMemberId, [vendorId]);

  const form = useState(user);

  ValidationAttach(form, (validator) => {
    validator.first.required();
    validator.last.required();
    validator.email.required();
    validator.phone.validate((value) => isPhoneNumber(value, 'US'), 'Please provide a valid 10-digit US phone number.');
  });

  const update = useMutationPromise(VendorInternalUserUpdateDocument);

  const navigate = useNavigate();

  useRegisterBreadcrumb(user.first + ' ' + user.last);

  const saveButton = (
    <PromiseButton
      key="save"
      disabled={!canEdit || !Validation(form).valid()}
      onClick={async () => {
        if (canEdit) {
          await update({ vendorId, userId, data: { ...form.get(), ownerMemberId: vendorId } });
        }

        navigate('../');
      }}
    >
      Save
    </PromiseButton>
  );

  const remove = useMutationPromise(VendorInternalUserDeleteDocument);

  const deleteButton = (
    <ConfirmationButton
      key="delete"
      style={ButtonStyle.WARNING}
      disabled={!Validation(form).valid() || userId === currentUser.id || query.vendor.users.length === 1}
      title="Delete User"
      description="This action cannot be undone."
      confirmText="Delete"
      onClick={async () => {
        await remove({ vendorId, userId });

        navigate('../');
      }}
    >
      Delete User
    </ConfirmationButton>
  );

  return (
    <Center padding>
      <Toolbar title={user.first + ' ' + user.last} actions={[deleteButton, saveButton]}>
        <FormGroup>
          <FormHorizontal state={form.first} name="First Name">
            <FormText state={form.first} disabled={!canEdit} />
          </FormHorizontal>
          <FormHorizontal state={form.last} name="Last Name">
            <FormText state={form.last} disabled={!canEdit} />
          </FormHorizontal>
          <FormHorizontal state={form.email} name="Email">
            <FormText state={form.email} disabled={!canEdit} />
          </FormHorizontal>
          <FormHorizontal state={form.phone} name="Phone Number">
            <FormText state={form.phone} disabled={!canEdit} />
          </FormHorizontal>
          <FormHorizontal state={form.dateOfBirth} name="Date of Birth">
            <FormStringDate state={form.dateOfBirth} disabled={!canEdit} />
          </FormHorizontal>
          <FormHorizontal state={form.roleIds} name="Roles">
            <Table card>
              <TableHead>
                <TableRow>
                  <TableHeadCell slim>Role</TableHeadCell>
                  <TableHeadCell slim />
                </TableRow>
              </TableHead>
              <TableBody>
                {query.vendor.roles
                  .filter((r) => r.type === RoleType.Vendor)
                  .map((r) => (
                    <TableRow key={r.id}>
                      <TableCell slim>{r.name}</TableCell>
                      <TableCell slim>
                        <FormArrayCheckbox state={form.roleIds} value={r.id} />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </FormHorizontal>
        </FormGroup>
      </Toolbar>
    </Center>
  );
}
