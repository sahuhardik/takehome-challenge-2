import { State, useState } from '@hookstate/core';
import Link from 'client/global/components/tailwind/Link';
import Selectable from 'client/global/components/tailwind/Selectable';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import Button from 'shared/components/tailwind/Button';
import { ActionType, ActionWrite, RuleActionFieldShowDocument, RuleWrite } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import EditIcon from 'shared/icons/EditIcon';
import { DetectValidator } from 'shared/utilities/Validation';

export function RuleActionFieldShowValidation(validator: DetectValidator<RuleWrite>) {
  const { fieldShow } = validator.actions.when((a) => a.type.get() === ActionType.FIELD_SHOW);
  fieldShow.fieldId.required();
}

function Edit({ state }: { state: State<ActionWrite> }) {
  const scope = useState(state);

  const { vendorId } = useParams();

  const query = useQueryHook(RuleActionFieldShowDocument, { vendorId }, 'cache-and-network');

  const edit = useState(!scope.fieldShow.fieldId.get());

  const field = query.vendor.fields.find((f) => f.id === scope.fieldShow.fieldId.get());

  if (!edit.get()) {
    return (
      <div className="action-preview">
        <Link icon={<EditIcon />} onClick={() => edit.set(true)}>
          Show the field <strong>{field.name}</strong>
        </Link>
      </div>
    );
  }

  return (
    <>
      <FormGroup plain>
        <FormHorizontal state={scope.fieldShow.fieldId} name="Field">
          <FormSelect
            state={scope.fieldShow.fieldId}
            options={query.vendor.fields.map((field) => ({ value: field.id, label: field.name }))}
          />
        </FormHorizontal>
      </FormGroup>
      <Button disabled={scope} onClick={() => edit.set(false)} className="mt-4">
        Finish
      </Button>
    </>
  );
}

export default function RuleActionFieldShow({ state }: { state: State<ActionWrite> }) {
  if (state.type.get() === ActionType.FIELD_SHOW) {
    return <Edit state={state} />;
  }

  return (
    <Selectable
      title="Show Field"
      onClick={() => {
        state.merge({
          type: ActionType.FIELD_SHOW,
          fieldShow: {
            visible: true,
          } as unknown as ActionWrite['fieldShow'],
        });
      }}
    >
      Present a custom field to the user that would ordinarily be hidden.
      <p className="mt-2">
        <strong className="font-semibold text-theme-secondary">Example Use Case:</strong> An order field should be shown
        to a user if they add particular services to an order.
      </p>
    </Selectable>
  );
}
