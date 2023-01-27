import { State, useState } from '@hookstate/core';
import Link from 'client/global/components/tailwind/Link';
import Selectable from 'client/global/components/tailwind/Selectable';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import Button from 'shared/components/tailwind/Button';
import {
  ActionAssignUserMetadataWrite,
  ActionType,
  ActionWrite,
  RuleActionAssignUserDocument,
  RuleWrite,
} from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import EditIcon from 'shared/icons/EditIcon';
import { DetectValidator } from 'shared/utilities/Validation';

export function RuleActionAssignUserValidation(validator: DetectValidator<RuleWrite>) {
  const { assignUser } = validator.actions.when((a) => a.type.get() === ActionType.ASSIGN_USER);
  assignUser.userId.required();
}

function Edit({ state }: { state: State<ActionWrite> }) {
  const scope = useState(state);

  const { vendorId, task: isForTask } = useParams();

  const query = useQueryHook(RuleActionAssignUserDocument, { vendorId }, 'cache-and-network');

  const edit = useState(!scope.assignUser?.userId?.get());

  if (!edit.get()) {
    const performable = query.vendor.performables.find(
      (prformable) => prformable.id === scope.assignUser?.performableId.get()
    );
    const user = query.vendor.users.find(({ user }) => user.id === scope.assignUser?.userId.get());
    return (
      <div className="action-preview">
        <Link icon={<EditIcon />} onClick={() => edit.set(true)}>
          Assigns <strong>{performable ? performable.name : 'all services'}</strong> to User{' '}
          <strong>{`${user?.user.first} ${user?.user.last}`}</strong>
        </Link>
      </div>
    );
  }

  return (
    <>
      <FormGroup plain>
        {!isForTask && (
          <FormHorizontal state={scope.assignUser.performableId} name="Service">
            <FormSelect
              state={scope.assignUser.performableId}
              options={query.vendor.performables.map((performable) => ({
                value: performable.id,
                label: performable.name,
              }))}
            />
          </FormHorizontal>
        )}
        <FormHorizontal state={scope.assignUser.userId} name="User">
          <FormSelect
            state={scope.assignUser.userId}
            options={query.vendor.users.map(({ user }) => ({
              value: user.id,
              label: `${user.first} ${user.last}`,
            }))}
          />
        </FormHorizontal>
      </FormGroup>
      <Button disabled={scope} onClick={() => edit.set(false)} className="mt-4">
        Finish
      </Button>
    </>
  );
}

export default function RuleActionAssignUser({ state }: { state: State<ActionWrite> }) {
  if (state.type.get() === ActionType.ASSIGN_USER) {
    return <Edit state={state} />;
  }

  return (
    <Selectable
      title="Assign User"
      onClick={() => {
        state.merge({
          type: ActionType.ASSIGN_USER,
          assignUser: {} as unknown as ActionAssignUserMetadataWrite,
        });
      }}
    >
      Assigns User to the service.
      <p className="mt-2">
        <strong className="font-semibold text-theme-secondary">Example Use Case:</strong>
        {
          // TODO: Need to put relevant message here
        }
      </p>
    </Selectable>
  );
}
