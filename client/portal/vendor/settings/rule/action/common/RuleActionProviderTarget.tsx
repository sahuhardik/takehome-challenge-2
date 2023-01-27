import { none, State, useState } from '@hookstate/core';
import FormProvider from 'client/global/components/form/FormProvider';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormText from 'shared/components/form/FormText';
import { VendorProvidersDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import { ValidationAttach } from 'shared/utilities/Validation';

export function RuleActionProviderTargetName({ state, empty }: { state: State<string>; empty?: string }) {
  const scope = useState(state);

  const { vendorId } = useParams();

  const query = useQueryHook(VendorProvidersDocument, { vendorId }, 'cache-first');

  if (scope.get()) {
    return <strong>{query.vendor.providers.find((p) => p.member.id === scope.get())?.member.company} </strong>;
  }

  return <>provider{empty ? ` ${empty} ` : ''}</>;
}

export default function RuleActionProviderTarget({ target, line }: { target: State<string>; line: State<string> }) {
  const scopedTarget = useState(target);
  const scopedLine = useState(line);

  const providerRelId = scopedTarget.get();

  const provider = useState({
    target: providerRelId ? 'select' : 'assignee',
    providerRelId,
  });

  ValidationAttach(provider, (validator) => {
    validator.target.required();
    validator.providerRelId.required();
  });

  return (
    <>
      <FormHorizontal state={provider.target} name="Payee">
        <FormSelect
          state={provider.target}
          options={[
            { value: 'assignee', label: 'Job Assignee' },
            { value: 'select', label: 'Specific Provider' },
          ]}
          onChange={() => {
            if (provider.target.get() === 'assignee') {
              scopedTarget.set(none);
            }
          }}
        />
      </FormHorizontal>
      {provider.target.get() === 'select' && (
        <>
          <FormHorizontal state={provider.providerRelId} name="Provider">
            <FormProvider
              state={provider.providerRelId}
              onChange={() => scopedTarget.set(provider.providerRelId.get())}
            />
          </FormHorizontal>
          <FormHorizontal
            state={scopedLine}
            name="Line Item"
            description="The description to use when added as a line item to a provider bill."
          >
            <FormText state={scopedLine} />
          </FormHorizontal>
        </>
      )}
    </>
  );
}
