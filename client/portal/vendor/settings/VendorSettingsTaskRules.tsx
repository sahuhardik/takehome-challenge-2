import { none, useState } from '@hookstate/core';
import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import useVendorRuleEdit from 'client/portal/vendor/components/rule/useVendorRuleState';
import VendorRuleForm from 'client/portal/vendor/components/rule/VendorRuleForm';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import {
  ActionWrite,
  ConditionLogic,
  ConditionType,
  RuleWrite,
  VendorTaskFragment,
  VendorTaskRulesDocument,
} from 'shared/generated';
import { useQueryPromise } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import EditIcon from 'shared/icons/EditIcon';
import { v4 } from 'uuid';

function Create({ onSave }: { onSave: () => void }) {
  const { task: taskId } = useParams();

  const data = {
    id: v4(),
    name: null as string,
    actions: [
      {
        id: v4(),
      } as ActionWrite,
    ],
    conditions: [
      {
        id: v4(),
        logic: ConditionLogic.AND,
        group: [0],
        type: ConditionType.PERFORMABLE,
        performable: {
          existence: 'EXISTS',
          performableId: taskId,
        },
      },
    ],
  } as RuleWrite;

  const refresh = useQueryPromise(VendorTaskRulesDocument);

  return (
    <VendorRuleForm
      data={data}
      locked={[0]}
      onSave={async () => {
        await refresh({ taskId });

        onSave();
      }}
    />
  );
}

function Edit({ ruleId, onSave }: { ruleId: string; onSave: () => void }) {
  const { task: taskId } = useParams();
  const data = useVendorRuleEdit(ruleId);
  const refresh = useQueryPromise(VendorTaskRulesDocument);

  return (
    <VendorRuleForm
      data={data}
      locked={[0]}
      onSave={async () => {
        await refresh({ taskId });

        onSave();
      }}
    />
  );
}

export default function VendorSettingsTaskRules({ task }: { task: VendorTaskFragment }) {
  const state = useState({
    create: false,
    edit: null as string,
  });

  if (state.create.get()) {
    return <Create onSave={() => state.create.set(false)} />;
  }

  if (state.edit.get()) {
    return <Edit ruleId={state.edit.get()} onSave={() => state.edit.set(none)} />;
  }

  return (
    <Table card>
      <TableHead>
        <TableRow>
          <TableHeadCell>Rule Name</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>
            <Link style={LinkStyle.BOLD} icon={<AddIcon />} onClick={() => state.create.set(true)}>
              Create New Rule
            </Link>
          </TableCell>
        </TableRow>
        {task.rules.map((rule) => (
          <TableRow key={rule.id}>
            <TableCell>
              <Link icon={<EditIcon />} onClick={() => state.edit.set(rule.id)}>
                {rule.name}
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
