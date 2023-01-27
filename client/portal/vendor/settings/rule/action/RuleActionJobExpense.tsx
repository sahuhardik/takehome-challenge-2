import { State, useState } from '@hookstate/core';
import FormMoney from 'client/global/components/form/FormMoney';
import Link from 'client/global/components/tailwind/Link';
import Selectable from 'client/global/components/tailwind/Selectable';
import RuleActionProviderTarget, {
  RuleActionProviderTargetName,
} from 'client/portal/vendor/settings/rule/action/common/RuleActionProviderTarget';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormText from 'shared/components/form/FormText';
import Button from 'shared/components/tailwind/Button';
import {
  ActionAmountType,
  ActionJobExpenseMetadataWrite,
  ActionType,
  ActionWrite,
  FieldType,
  RuleActionPerformableDocument,
  RuleWrite,
} from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import EditIcon from 'shared/icons/EditIcon';
import Money from 'shared/utilities/Money';
import { DetectValidator } from 'shared/utilities/Validation';

export function RuleActionJobExpenseValidation(validator: DetectValidator<RuleWrite>) {
  const { jobExpense } = validator.actions.when((a) => a.type.get() === ActionType.JOB_EXPENSE);

  jobExpense.amount.required();
  jobExpense.amountType.required();
}

function Edit({ state }: { state: State<ActionWrite> }) {
  const scope = useState(state);

  const { vendorId } = useParams();

  const query = useQueryHook(RuleActionPerformableDocument, { vendorId }, 'cache-and-network');

  const edit = useState(!scope.jobExpense.amount.get());
  const service = query.vendor.performables.find((s) => s.id === scope.jobExpense.performableId.get());
  const field = service?.properties.find((p) => p.id === scope.jobExpense.fieldId.get());
  const option = field?.values.find((v) => v.id === scope.jobExpense.fieldOptionId.get());

  if (!edit.get()) {
    const amount = parseFloat(scope.jobExpense.amount.get());

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

    if (scope.jobExpense.providerMemberId.get()) {
      let amountType = (
        <>
          {amount < 0 ? 'charge them ' : 'pay them '}
          <strong>
            <Money>{amount < 0 ? amount * -1 : amount}</Money>
          </strong>{' '}
        </>
      );

      if (scope.jobExpense.amountType.get() === ActionAmountType.Percentage) {
        if (amount > 0) {
          amountType = (
            <>
              give them <strong>{amount}%</strong> of the total job earnings (leaving <strong>{100 - amount}%</strong>{' '}
              for the original assignee)
            </>
          );
        } else {
          amountType = (
            <>
              charge them <strong>{amount * -1}%</strong> of the total job earnings
            </>
          );
        }
      }

      return (
        <div className="action-preview">
          <Link icon={<EditIcon />} onClick={() => edit.set(true)}>
            {service ? (
              <>
                For every <strong>{service.internalName || service.name}</strong> job
              </>
            ) : (
              <>
                For <strong>every</strong> job
              </>
            )}{' '}
            added to an order, create a new expense line item for{' '}
            <RuleActionProviderTargetName state={scope.jobExpense.providerMemberId} /> and {amountType} {when}
          </Link>
        </div>
      );
    }

    let amountType = (
      <strong>
        <Money>{amount < 0 ? amount * -1 : amount}</Money>
      </strong>
    );

    if (scope.jobExpense.amountType.get() === ActionAmountType.Percentage) {
      amountType = <strong>{amount}%</strong>;
    }

    if (amount < 0) {
      return (
        <div className="action-preview">
          <Link icon={<EditIcon />} onClick={() => edit.set(true)}>
            Reduce provider payout for{' '}
            {service ? (
              <>
                <strong>{service.internalName || service.name}</strong>
              </>
            ) : (
              <>
                <strong>all</strong> services
              </>
            )}{' '}
            by {amountType} per job
            {when}
          </Link>
        </div>
      );
    }

    return (
      <div className="action-preview">
        <Link icon={<EditIcon />} onClick={() => edit.set(true)}>
          Pay <RuleActionProviderTargetName state={scope.jobExpense.providerMemberId} empty="an additional" />
          {amountType} per job for{' '}
          {service ? (
            <>
              <strong>{service.internalName || service.name}</strong>
              {when}
            </>
          ) : (
            <>
              <strong>all</strong> services
            </>
          )}
        </Link>
      </div>
    );
  }

  return (
    <>
      <FormGroup plain>
        <RuleActionProviderTarget target={scope.jobExpense.providerMemberId} line={scope.jobExpense.line} />
        <FormHorizontal state={scope.jobExpense.amountType} name="Amount Type">
          <FormSelect
            state={scope.jobExpense.amountType}
            options={[
              { value: ActionAmountType.Currency, label: 'Dollars' },
              { value: ActionAmountType.Percentage, label: 'Percentage' },
            ]}
          />
        </FormHorizontal>
        <FormHorizontal state={scope.jobExpense.amount} name="Amount">
          <FormMoney state={scope.jobExpense.amount} />
        </FormHorizontal>
        <FormHorizontal
          state={scope.jobExpense.line}
          name="Line Item"
          description="Leave blank to adjust price, otherwise it will be added to the invoice on a new line item."
        >
          <FormText state={scope.jobExpense.line} />
        </FormHorizontal>
        <FormHorizontal state={scope.jobExpense.performableId} name="Service">
          <FormSelect
            state={scope.jobExpense.performableId}
            options={query.vendor.performables.map((s) => ({ value: s.id, label: s.internalName || s.name }))}
          />
        </FormHorizontal>
        {service?.properties.length > 0 && (
          <FormHorizontal state={scope.jobExpense.fieldId} name="Field">
            <FormSelect
              state={scope.jobExpense.fieldId}
              options={service.properties.filter((p) => !p.archived).map((p) => ({ value: p.id, label: p.name }))}
            />
          </FormHorizontal>
        )}
        {field?.values.length > 0 && (
          <FormHorizontal state={scope.jobExpense.fieldOptionId} name="Option">
            <FormSelect
              state={scope.jobExpense.fieldOptionId}
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

export default function RuleActionJobExpense({ state }: { state: State<ActionWrite> }) {
  if (state.type.get() === ActionType.JOB_EXPENSE) {
    return <Edit state={state} />;
  }

  return (
    <Selectable
      title="Adjust Job Expense"
      onClick={() => {
        state.merge({
          type: ActionType.JOB_EXPENSE,
          jobExpense: {} as unknown as ActionJobExpenseMetadataWrite,
        });
      }}
    >
      Make adjustments to the amount a provider receives for performing a job based on the conditions below.
      <p className="mt-2">
        <strong className="font-semibold text-theme-secondary">Example Use Case:</strong> Unique rates have been
        negotiated with a contractor or a service pays more if certain properties are selected.
      </p>
    </Selectable>
  );
}
