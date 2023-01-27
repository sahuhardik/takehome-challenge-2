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
  ActionOrderRevenueMetadataWrite,
  ActionType,
  ActionWrite,
  RuleWrite,
} from 'shared/generated';
import { DetectValidator } from 'shared/utilities/Validation';

export function RuleActionOrderRevenueValidation(validator: DetectValidator<RuleWrite>) {
  const { orderRevenue } = validator.actions.when((a) => a.type.get() === ActionType.ORDER_REVENUE);

  orderRevenue.amount.required();
  orderRevenue.line.required();
}

function Edit({ state }: { state: State<ActionWrite> }) {
  const scope = useState(state);

  const edit = useState(!scope.orderRevenue.amount.get());

  if (!edit.get()) {
    return (
      <RuleActionHumanizeAmount
        edit={edit}
        amount={scope.orderRevenue.amount.get()}
        positive="Charge customer an additional"
        negative="Apply a discount of"
        suffix="per order"
        type={scope.orderRevenue.amountType.get()}
      />
    );
  }

  return (
    <>
      <FormGroup plain>
        <FormHorizontal state={scope.orderRevenue.amountType} name="Amount Type">
          <FormSelect
            state={scope.orderRevenue.amountType}
            options={[
              { value: ActionAmountType.Currency, label: 'Dollars' },
              { value: ActionAmountType.Percentage, label: 'Percentage' },
            ]}
          />
        </FormHorizontal>
        <FormHorizontal state={scope.orderRevenue.amount} name="Amount">
          <FormMoney state={scope.orderRevenue.amount} />
        </FormHorizontal>
        <FormHorizontal
          state={scope.orderRevenue.line}
          name="Line Item"
          description="The description to use when added as a line item to a provider bill."
        >
          <FormText state={scope.orderRevenue.line} />
        </FormHorizontal>
      </FormGroup>
      <Button disabled={scope} onClick={() => edit.set(false)} className="mt-4">
        Finish
      </Button>
    </>
  );
}

export default function RuleActionOrderRevenue({ state }: { state: State<ActionWrite> }) {
  if (state.type.get() === ActionType.ORDER_REVENUE) {
    return <Edit state={state} />;
  }

  return (
    <Selectable
      title="Adjust Order Revenue"
      onClick={() => {
        state.merge({
          type: ActionType.ORDER_REVENUE,
          orderRevenue: { amountType: ActionAmountType.Currency } as unknown as ActionOrderRevenueMetadataWrite,
        });
      }}
    >
      Add additional charges to an order that are unrelated to the services they have purchased.
      <p className="mt-2">
        <strong className="font-semibold text-theme-secondary">Example Use Case:</strong> Give the customer a discount
        by decreasing the total invoice amount if they have added more than service to the order (eg: bundles).
      </p>
    </Selectable>
  );
}
