import { State, useState } from '@hookstate/core';
import Link from 'client/global/components/tailwind/Link';
import Selectable from 'client/global/components/tailwind/Selectable';
import * as React from 'react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import Button from 'shared/components/tailwind/Button';
import { ActionType, ActionWrite, RuleWrite, VendorServicesDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import EditIcon from 'shared/icons/EditIcon';
import { DetectValidator, ValidationAttach } from 'shared/utilities/Validation';

export function RuleActionServiceFieldDisableValidation(validator: DetectValidator<RuleWrite>) {
  const { fieldDisable } = validator.actions.when((a) => a.type.get() === ActionType.FIELD_DISABLE);
  fieldDisable.fieldId.required();
}

function Edit({ state }: { state: State<ActionWrite> }) {
  const scope = useState(state);

  const { vendorId } = useParams();

  const query = useQueryHook(VendorServicesDocument, { vendorId }, 'cache-and-network');

  const edit = useState(!scope.fieldDisable.fieldId.get());
  const serviceId = useState(null as string);

  ValidationAttach(serviceId, (validator) => {
    validator.required();
  });

  let service;

  // TODO: ETL performable_property to field table
  const firstLoad = scope.fieldDisable.fieldId.get() && !serviceId.get();

  if (firstLoad) {
    service = query.vendor.services.find((s) => s.properties.some((p) => p.id === scope.fieldDisable.fieldId.get()));
  } else {
    service = query.vendor.services.find((s) => s.id === serviceId.get());
  }

  useEffect(() => {
    if (firstLoad) {
      serviceId.set(service.id);
    }
    // eslint-disable-next-line
  }, []);

  const property = service?.properties.find((p) => p.id === scope.fieldDisable.fieldId.get());

  if (!edit.get()) {
    return (
      <div className="action-preview">
        <Link icon={<EditIcon />} onClick={() => edit.set(true)}>
          Disable the property <strong>{property.name}</strong> on service <strong>{service.name}</strong>
        </Link>
      </div>
    );
  }

  const serviceOptions = query.vendor.services
    .filter((s) => s.properties.length > 0)
    .map((s) => ({ value: s.id, label: s.name }));

  return (
    <>
      <FormGroup plain>
        <FormHorizontal state={serviceId} name="Service">
          <FormSelect state={serviceId} options={serviceOptions} />
        </FormHorizontal>
        {!!service && (
          <FormHorizontal state={scope.fieldDisable.fieldId} name="Property">
            <FormSelect
              state={scope.fieldDisable.fieldId}
              options={service.properties.filter((p) => !p.archived).map((p) => ({ value: p.id, label: p.name }))}
            />
          </FormHorizontal>
        )}
      </FormGroup>
      <Button disabled={scope} onClick={() => edit.set(false)} className="mt-4">
        Finish
      </Button>
    </>
  );
}

export default function RuleActionServiceFieldDisable({ state }: { state: State<ActionWrite> }) {
  if (state.type.get() === ActionType.FIELD_DISABLE) {
    return <Edit state={state} />;
  }

  return (
    <Selectable
      title="Disable Service Property"
      onClick={() => {
        state.merge({
          type: ActionType.FIELD_DISABLE,
          fieldDisable: {
            disabled: true,
          } as unknown as ActionWrite['fieldDisable'],
        });
      }}
    >
      Present a service property field to a user, but prevent them from providing or changing the value.
      <p className="mt-2">
        <strong className="font-semibold text-theme-secondary">Example Use Case:</strong> A particular service add-on is
        not available at certain date/times or is only an option if a customer has a field set to a certain value on
        their account.
      </p>
    </Selectable>
  );
}
