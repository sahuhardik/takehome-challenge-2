import { State } from '@hookstate/core';
import Link from 'client/global/components/tailwind/Link';
import numeral from 'numeral';
import * as React from 'react';
import { ActionAmountType } from 'shared/generated';
import EditIcon from 'shared/icons/EditIcon';
import Money from 'shared/utilities/Money';

export default function RuleActionHumanizeAmount({
  edit,
  amount,
  type,
  positive,
  negative,
  suffix,
}: {
  edit: State<boolean>;
  amount: string;
  positive: React.ReactNode;
  negative: React.ReactNode;
  suffix: React.ReactNode;
  type: ActionAmountType;
}) {
  const parsed = parseFloat(amount);

  let nominal = <Money>{parsed}</Money>;

  if (type === ActionAmountType.Percentage) {
    nominal = <>{numeral(parsed / 100).format('0.000%')}</>;
  }

  const action = parsed < 0 ? negative : positive;

  return (
    <div className="action-preview">
      <Link icon={<EditIcon />} onClick={() => edit.set(true)}>
        {action} <strong className={`${parsed > 0 ? 'text-green-700' : 'text-red-700'} font-bold`}>{nominal}</strong>{' '}
        {suffix}
      </Link>
    </div>
  );
}
