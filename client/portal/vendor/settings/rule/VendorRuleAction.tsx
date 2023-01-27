import { State } from '@hookstate/core';
import SpinnerLoader from 'client/global/components/tailwind/SpinnerLoader';
import RuleActionAssignProvider, {
  RuleActionAssignProviderValidation,
} from 'client/portal/vendor/settings/rule/action/RuleActionAssignProvider';
import RuleActionAssignUser, {
  RuleActionAssignUserValidation,
} from 'client/portal/vendor/settings/rule/action/RuleActionAssignUser';
import RuleActionAttachFiles, {
  RuleActionAttachFilesValidation,
} from 'client/portal/vendor/settings/rule/action/RuleActionAttachFiles';
import RuleActionFieldShow, {
  RuleActionFieldShowValidation,
} from 'client/portal/vendor/settings/rule/action/RuleActionFieldShow';
import RuleActionJobExpense, {
  RuleActionJobExpenseValidation,
} from 'client/portal/vendor/settings/rule/action/RuleActionJobExpense';
import RuleActionJobRevenue, {
  RuleActionJobRevenueValidation,
} from 'client/portal/vendor/settings/rule/action/RuleActionJobRevenue';
import RuleActionOrderExpense, {
  RuleActionOrderExpenseValidation,
} from 'client/portal/vendor/settings/rule/action/RuleActionOrderExpense';
import RuleActionOrderRevenue, {
  RuleActionOrderRevenueValidation,
} from 'client/portal/vendor/settings/rule/action/RuleActionOrderRevenue';
import RuleActionServiceFieldDisable, {
  RuleActionServiceFieldDisableValidation,
} from 'client/portal/vendor/settings/rule/action/RuleActionServiceFieldDisable';
import * as React from 'react';
import { ActionType, ActionWrite, RuleWrite } from 'shared/generated';
import { DetectValidator } from 'shared/utilities/Validation';

export function RuleActionValidation(validator: DetectValidator<RuleWrite>) {
  validator.actions.type.required();

  RuleActionOrderRevenueValidation(validator);
  RuleActionOrderExpenseValidation(validator);
  RuleActionJobRevenueValidation(validator);
  RuleActionJobExpenseValidation(validator);
  RuleActionServiceFieldDisableValidation(validator);
  RuleActionFieldShowValidation(validator);
  RuleActionAssignProviderValidation(validator);
  RuleActionAssignUserValidation(validator);
  RuleActionAttachFilesValidation(validator);
}

function Select({ state }: { state: State<ActionWrite> }) {
  return (
    <>
      <div>Choose an action type:</div>
      <div className="space-y mt">
        <RuleActionOrderExpense state={state} />
        <RuleActionOrderRevenue state={state} />
        <RuleActionJobRevenue state={state} />
        <RuleActionJobExpense state={state} />
        <RuleActionServiceFieldDisable state={state} />
        <RuleActionFieldShow state={state} />
        <RuleActionAssignProvider state={state} />
        <RuleActionAssignUser state={state} />
        <RuleActionAttachFiles state={state} />
      </div>
    </>
  );
}

export default function VendorRuleAction({ state }: { state: State<ActionWrite> }) {
  let content;

  switch (state.type.get()) {
    case ActionType.ORDER_EXPENSE:
      content = <RuleActionOrderExpense state={state} />;
      break;
    case ActionType.ORDER_REVENUE:
      content = <RuleActionOrderRevenue state={state} />;
      break;
    case ActionType.JOB_REVENUE:
      content = <RuleActionJobRevenue state={state} />;
      break;
    case ActionType.JOB_EXPENSE:
      content = <RuleActionJobExpense state={state} />;
      break;
    case ActionType.FIELD_SHOW:
      content = <RuleActionFieldShow state={state} />;
      break;
    case ActionType.FIELD_DISABLE:
      content = <RuleActionServiceFieldDisable state={state} />;
      break;
    case ActionType.ASSIGN_PROVIDER:
      content = <RuleActionAssignProvider state={state} />;
      break;
    case ActionType.ASSIGN_USER:
      content = <RuleActionAssignUser state={state} />;
      break;
    case ActionType.ATTACH_FILES:
      content = <RuleActionAttachFiles state={state} />;
      break;
    default:
      content = <Select state={state} />;
      break;
  }

  return <SpinnerLoader>{content}</SpinnerLoader>;
}
