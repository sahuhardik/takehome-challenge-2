import { State, useState } from '@hookstate/core';
import FormMoney from 'client/global/components/form/FormMoney';
import Selectable from 'client/global/components/tailwind/Selectable';
import RuleActionHumanizeAmount from 'client/portal/vendor/settings/rule/action/common/RuleActionHumanizeAmount';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormText from 'shared/components/form/FormText';
import Button from 'shared/components/tailwind/Button';
import {
  ActionAmountType,
  ActionJobRevenueMetadataWrite,
  ActionType,
  ActionWrite,
  FieldType,
  RuleActionPerformableDocument,
  RuleWrite,
} from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import { DetectValidator } from 'shared/utilities/Validation';

export function RuleActionJobRevenueValidation(validator: DetectValidator<RuleWrite>) {
  const { jobRevenue } = validator.actions.when((a) => a.type.get() === ActionType.JOB_REVENUE);

  jobRevenue.amount.required();
}

function Edit({ state }: { state: State<ActionWrite> }) {
  const scope = useState(state);

  const { vendorId } = useParams();

  const { vendor } = useQueryHook(RuleActionPerformableDocument, { vendorId }, 'cache-and-network');

  const edit = useState(!scope.jobRevenue.amount.get());

  const performable = vendor.performables.find((p) => p.id === scope.jobRevenue.performableId.get());
  const field = performable?.properties.find((p) => p.id === scope.jobRevenue.fieldId.get());
  const option = field?.values.find((v) => v.id === scope.jobRevenue.fieldOptionId.get());

  if (!edit.get()) {
    const amount = parseFloat(scope.jobRevenue.amount.get());

    let when;

    let selected: React.ReactNode;

    // TODO: code is shared with ConditionPerformable
    if (field?.fieldType === FieldType.Select) {
      if (option) {
        selected = (
          <>
            equals <strong>{option.name}</strong>
          </>
        );
      } else {
        selected = (
          <>
            has <strong>any</strong> value selected
          </>
        );
      }
    } else {
      selected = 'is selected';
    }

    if (field) {
      when = (
        <>
          {' '}
          when <strong>{field.name}</strong> {selected}
        </>
      );
    }

    const positive = 'Charge customer an additional';
    let negative = (
      <>
        Discount <strong>all</strong> services by
      </>
    );

    let suffix = <>per job for all services</>;

    if (performable) {
      if (amount < 0) {
        negative = (
          <>
            Discount the <strong>{performable.internalName || performable.name}</strong> service by
          </>
        );

        suffix = (
          <>
            per job
            {when}
          </>
        );
      } else {
        suffix = (
          <>
            per job for <strong>{performable.internalName || performable.name}</strong> {when}
          </>
        );
      }
    }

    return (
      <RuleActionHumanizeAmount
        edit={edit}
        amount={scope.jobRevenue.amount.get()}
        positive={positive}
        negative={negative}
        suffix={suffix}
        type={scope.jobRevenue.amountType.get()}
      />
    );
  }

  return (
    <>
      <FormGroup plain>
        <FormHorizontal state={scope.jobRevenue.amountType} name="Amount Type">
          <FormSelect
            state={scope.jobRevenue.amountType}
            options={[
              { value: ActionAmountType.Currency, label: 'Dollars' },
              { value: ActionAmountType.Percentage, label: 'Percentage' },
            ]}
          />
        </FormHorizontal>
        <FormHorizontal state={scope.jobRevenue.amount} name="Amount">
          <FormMoney state={scope.jobRevenue.amount} />
        </FormHorizontal>
        <FormHorizontal
          state={scope.jobRevenue.line}
          name="Line Item"
          description="Leave blank to adjust price, otherwise it will be added to the invoice on a new line item."
        >
          <FormText state={scope.jobRevenue.line} />
        </FormHorizontal>
        <FormHorizontal state={scope.jobRevenue.performableId} name="Service">
          <FormSelect
            state={scope.jobRevenue.performableId}
            options={vendor.performables.map((s) => ({ value: s.id, label: s.internalName || s.name }))}
          />
        </FormHorizontal>
        {performable?.properties.length > 0 && (
          <FormHorizontal state={scope.jobRevenue.fieldId} name="Field">
            <FormSelect
              state={scope.jobRevenue.fieldId}
              options={performable.properties.filter((p) => !p.archived).map((p) => ({ value: p.id, label: p.name }))}
            />
          </FormHorizontal>
        )}
        {field?.values.length > 0 && (
          <FormHorizontal state={scope.jobRevenue.fieldOptionId} name="Option">
            <FormSelect
              state={scope.jobRevenue.fieldOptionId}
              options={field.values.filter((v) => !v.archived).map((v) => ({ value: v.id, label: v.name }))}
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

export default function RuleActionJobRevenue({ state }: { state: State<ActionWrite> }) {
  if (state.type.get() === ActionType.JOB_REVENUE) {
    return <Edit state={state} />;
  }

  return (
    <Selectable
      title="Adjust Job Revenue"
      onClick={() => {
        state.merge({
          type: ActionType.JOB_REVENUE,
          jobRevenue: {} as unknown as ActionJobRevenueMetadataWrite,
        });
      }}
    >
      Make adjustments to the amount a customer pays for a service based on the conditions below.
      <p className="mt-2">
        <strong className="font-semibold text-theme-secondary">Example Use Case:</strong> A customer or customer group
        receives loyalty/legacy pricing or a service is more expensive under certain circumstances.
      </p>
    </Selectable>
  );
}
