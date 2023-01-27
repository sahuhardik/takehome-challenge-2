import { State, useState } from '@hookstate/core';
import FormMoney from 'client/global/components/form/FormMoney';
import Selectable from 'client/global/components/tailwind/Selectable';
import RuleActionHumanizeAmount from 'client/portal/vendor/settings/rule/action/common/RuleActionHumanizeAmount';
import * as React from 'react';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormText from 'shared/components/form/FormText';
import Button from 'shared/components/tailwind/Button';
import {
  ActionAmountType,
  ActionOrderExpenseMetadataWrite,
  ActionType,
  ActionWrite,
  ExpenseSplitType,
  RuleWrite,
} from 'shared/generated';
import { DetectValidator } from 'shared/utilities/Validation';

export function RuleActionOrderExpenseValidation(validator: DetectValidator<RuleWrite>) {
  const { orderExpense } = validator.actions.when((a) => a.type.get() === ActionType.ORDER_EXPENSE);

  orderExpense.amount.required();
  orderExpense.line.required();
  orderExpense.amountType.required();
  orderExpense.split.required();
}

function Edit({ state }: { state: State<ActionWrite> }) {
  const scope = useState(state);

  const edit = useState(!scope.orderExpense.amount.get());

  if (!edit.get()) {
    const per = scope.orderExpense.split.get() === ExpenseSplitType.Job ? 'job' : 'appointment';

    return (
      <RuleActionHumanizeAmount
        edit={edit}
        amount={scope.orderExpense.amount.get()}
        positive="Pay provider an additional"
        negative="Reduce provider payout by"
        suffix={`per ${per}`}
        type={scope.orderExpense.amountType.get()}
      />
    );
  }

  return (
    <>
      <FormGroup plain>
        <FormHorizontal state={scope.orderExpense.amountType} name="Amount Type">
          <FormSelect
            state={scope.orderExpense.amountType}
            options={[
              { value: ActionAmountType.Currency, label: 'Dollars' },
              { value: ActionAmountType.Percentage, label: 'Percentage' },
            ]}
          />
        </FormHorizontal>
        <FormHorizontal state={scope.orderExpense.amount} name="Amount">
          <FormMoney state={scope.orderExpense.amount} />
        </FormHorizontal>
        <FormHorizontal
          state={scope.orderExpense.split}
          name="Split Type"
          description="How should the amount above be split on an order?"
        >
          <FormSelect
            state={scope.orderExpense.split}
            options={[
              { label: 'Per Appointment', value: ExpenseSplitType.Event },
              { label: 'Per Job', value: ExpenseSplitType.Job },
            ]}
          />
        </FormHorizontal>
        <FormHorizontal
          state={scope.orderExpense.line}
          name="Line Item"
          description="The description to use when added as a line item to a provider bill."
        >
          <FormText state={scope.orderExpense.line} />
        </FormHorizontal>
      </FormGroup>
      <Button disabled={scope} onClick={() => edit.set(false)} className="mt-4">
        Finish
      </Button>
    </>
  );
}

export default function RuleActionOrderExpense({ state }: { state: State<ActionWrite> }) {
  if (state.type.get() === ActionType.ORDER_EXPENSE) {
    return <Edit state={state} />;
  }

  return (
    <Selectable
      title="Adjust Order Expense"
      onClick={() => {
        state.merge({
          type: ActionType.ORDER_EXPENSE,
          orderExpense: {} as unknown as ActionOrderExpenseMetadataWrite,
        });
      }}
    >
      Add additional costs to an order if the conditions below are met.
      <p className="mt-2">
        <strong className="font-semibold text-theme-secondary">Example Use Case:</strong> Split a travel fee amongst
        every provider who has an appointment outside of your standard service area.
      </p>
    </Selectable>
  );
}
