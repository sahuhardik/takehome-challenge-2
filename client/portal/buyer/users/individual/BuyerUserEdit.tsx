import { useState } from '@hookstate/core';
import { isPhoneNumber } from 'class-validator';
import { canEditUser } from 'client/global/components/form/FormUserRoles';
import useGetCurrentBuyerRelId from 'client/global/hooks/useCurrentBuyer';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import { BuyerToolbar } from 'client/portal/buyer/BuyerToolbar';
import { getSelectRoles } from 'client/portal/buyer/users/individual/util';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormStringDate from 'shared/components/form/FormStringDate';
import FormText from 'shared/components/form/FormText';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import {
  BuyerUserAssignDocument,
  BuyerUsersDocument,
  BuyerUserUpdateDocument,
  BuyerVendorDocument,
  UserByEmailDocument,
  UserWrite,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import DeleteIcon from 'shared/icons/DeleteIcon';
import { useUser } from 'shared/UserState';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

export default function BuyerUserEdit() {
  const buyerRelId = useGetCurrentBuyerRelId();
  const { userId } = useParams();
  const query = useQueryHook(BuyerUsersDocument, { buyerRelId });
  const buyerId = query.buyer.buyerId;
  const vendorId = useCurrentVendorId();
  const { vendor } = useQueryHook(BuyerVendorDocument, { vendorId }, 'cache-first');
  const getUserByEmail = useQueryPromise(UserByEmailDocument);
  const conflictError = useState('');
  const currentUser = useUser();

  const {
    roles,
    user: { id, ...user },
  } = query.buyer.users.find((u) => u.user.id === userId);

  const canEdit =
    currentUser.superuser || canEditUser(false, user.ownByMyself, user.ownerMemberId, [buyerId, vendorId]);

  const form = useState<UserWrite & { roleId?: string }>({
    first: user.first,
    last: user.last,
    email: user.email,
    phone: user.phone,
    ownerMemberId: buyerId,
    dateOfBirth: user.dateOfBirth,
    roleId: useState(roles.map((x) => x.id)).get()[0],
  });

  const assign = useMutationPromise(BuyerUserAssignDocument);

  ValidationAttach(form, (validator) => {
    validator.first.required();
    validator.last.required();
    validator.email.required();
    validator.roleId.required();
    validator.phone.validate((value) => isPhoneNumber(value, 'US'), 'Please provide a valid 10-digit US phone number.');
  });

  const update = useMutationPromise(BuyerUserUpdateDocument);

  const navigate = useNavigate();

  const saveButton = (
    <PromiseButton
      key="save"
      disabled={!Validation(form).valid()}
      onClick={async () => {
        const { roleId, ...data } = form.get();
        const { userByEmail } = await getUserByEmail({ email: data.email });
        if (!userByEmail?.id || userByEmail?.id === userId) {
          if (canEdit) {
            await update({ buyerId, userId, data });
          }
          await assign({ buyerId, userId, roleIds: [roleId] });
          navigate('../');
        } else {
          conflictError.set('There is already a user with this email');
        }
      }}
    >
      Save
    </PromiseButton>
  );

  return (
    <BuyerToolbar title={user.first + ' ' + user.last} actions={saveButton}>
      {conflictError.get() && (
        <Message
          type={MessageType.ERROR}
          round
          actions={[
            {
              icon: <DeleteIcon />,
              label: 'Close',
              onClick: () => {
                conflictError.set('');
              },
            },
          ]}
        >
          {conflictError.get()}
        </Message>
      )}
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
        <FormHorizontal state={form.roleId} name="Role">
          <FormSelect
            state={form.roleId}
            options={getSelectRoles(vendor.roles, query.buyer.users, userId).map((r) => ({
              label: r.name,
              value: r.id,
            }))}
          />
        </FormHorizontal>
      </FormGroup>
    </BuyerToolbar>
  );
}
