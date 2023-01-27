import { State, useState } from '@hookstate/core';
import Link from 'client/global/components/tailwind/Link';
import Selectable from 'client/global/components/tailwind/Selectable';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import Button from 'shared/components/tailwind/Button';
import {
  ActionAssignProviderMetadataWrite,
  ActionType,
  ActionWrite,
  RuleActionAssignProviderDocument,
  RuleWrite,
} from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import EditIcon from 'shared/icons/EditIcon';
import { DetectValidator } from 'shared/utilities/Validation';

export function RuleActionAssignProviderValidation(validator: DetectValidator<RuleWrite>) {
  const { assignProvider } = validator.actions.when((a) => a.type.get() === ActionType.ASSIGN_PROVIDER);
  assignProvider.providerId.required();
}

function Edit({ state }: { state: State<ActionWrite> }) {
  const scope = useState(state);

  const { vendorId, task: isForTask } = useParams();

  const query = useQueryHook(RuleActionAssignProviderDocument, { vendorId }, 'cache-and-network');

  const edit = useState(!scope.assignProvider?.providerId?.get());

  if (!edit.get()) {
    const performable = query.vendor.performables.find(
      (prformable) => prformable.id === scope.assignProvider?.performableId.get()
    );
    const provider = query.vendor.providers.find(
      (provider) => provider.member.id === scope.assignProvider?.providerId.get()
    );
    return (
      <div className="action-preview">
        <Link icon={<EditIcon />} onClick={() => edit.set(true)}>
          Assigns <strong>{performable ? performable.name : 'all services'}</strong> to provider{' '}
          <strong>{provider?.member?.company}</strong>
        </Link>
      </div>
    );
  }

  return (
    <>
      <FormGroup plain>
        {!isForTask && (
          <FormHorizontal state={scope.assignProvider.performableId} name="Service">
            <FormSelect
              state={scope.assignProvider.performableId}
              options={query.vendor.performables.map((performable) => ({
                value: performable.id,
                label: performable.name,
              }))}
            />
          </FormHorizontal>
        )}
        <FormHorizontal state={scope.assignProvider.providerId} name="Provider">
          <FormSelect
            state={scope.assignProvider.providerId}
            options={query.vendor.providers.map((provider) => ({
              value: provider.member.id,
              label: provider.member.company,
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

export default function RuleActionAssignProvider({ state }: { state: State<ActionWrite> }) {
  if (state.type.get() === ActionType.ASSIGN_PROVIDER) {
    return <Edit state={state} />;
  }

  return (
    <Selectable
      title="Assign Provider"
      onClick={() => {
        state.merge({
          type: ActionType.ASSIGN_PROVIDER,
          assignProvider: {} as unknown as ActionAssignProviderMetadataWrite,
        });
      }}
    >
      Assigns provider to the service.
      <p className="mt-2">
        <strong className="font-semibold text-theme-secondary">Example Use Case:</strong> A service has a task
        configured as an additional step that can be done by multiple providers. Based upon the order or service
        configuration, assign the task to one provider over another.
      </p>
    </Selectable>
  );
}
