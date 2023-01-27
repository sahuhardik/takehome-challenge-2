import { convertConditions } from 'client/portal/vendor/components/condition/utils';
import { RuleWrite, VendorRuleFragment, VendorRuleGetDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

export default function useVendorRuleEdit(ruleId: string): RuleWrite {
  const data = useQueryHook(VendorRuleGetDocument, { ruleId });

  // TODO: should there be a different graphql field that does this for us?
  type Action = VendorRuleFragment['actions'][0];
  type ActionType = Action['__typename'];

  const convertAction = <
    T extends ActionType,
    A extends Action,
    R extends Action & { __typename: T },
    M extends keyof R
  >(
    typename: T,
    metadata: M,
    action: A['__typename'] extends T ? R : A
  ): R[M] => {
    // TODO: how to make this type safe
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return action.__typename === typename ? action[metadata] : undefined;
  };

  return {
    id: ruleId,
    name: data.rule.name,
    actions: data.rule.actions.map((a) => ({
      id: a.id,
      type: a.type,
      orderExpense: convertAction('ActionOrderExpense', 'orderExpense', a),
      orderRevenue: convertAction('ActionOrderRevenue', 'orderRevenue', a),
      jobExpense: convertAction('ActionJobExpense', 'jobExpense', a),
      jobRevenue: convertAction('ActionJobRevenue', 'jobRevenue', a),
      fieldDisable: convertAction('ActionFieldDisable', 'field', a),
      fieldShow: convertAction('ActionFieldShow', 'fieldShow', a),
      assignProvider: convertAction('ActionAssignProvider', 'assignProvider', a),
      assignUser: convertAction('ActionAssignUser', 'assignUser', a),
      attachFiles: convertAction('ActionAttachFiles', 'attachFiles', a),
    })),
    conditions: convertConditions(data.rule.conditions),
  };
}
