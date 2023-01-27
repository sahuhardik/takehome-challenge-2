import { SlidebarOpenLink } from 'client/global/components/button/SlidebarOpenButton';
import { TableCell, TableRow } from 'client/global/components/tailwind/Table';
import CombinedLine from 'client/portal/vendor/components/CombinedLine';
import LineItemSlidebar from 'client/portal/vendor/components/LineItemSlidebar';
import * as React from 'react';
import { Permission } from 'shared/generated';
import EditIcon from 'shared/icons/EditIcon';
import { useHasPermission } from 'shared/UserState';
import Money from 'shared/utilities/Money';

const none = <div className="text-center">-</div>;
export function Line({ line, simple = false }: { simple?: boolean; line: CombinedLine }) {
  let field = line.fieldName;
  const desc = line.revenue?.description || line.expense?.description || line.fieldValue;
  const hasPermission = useHasPermission();

  if (desc === field) {
    field = null;
  }

  return (
    <TableRow key={line.id} secondary={!simple} hover>
      <TableCell slim={!simple} className="break-all">
        {!simple && field && <div className="font-semibold">{field}</div>}
        {hasPermission(Permission.ViewExpenses) && (line.revenue || line.expense) ? (
          <SlidebarOpenLink icon={<EditIcon />} text={desc}>
            <LineItemSlidebar line={line} />
          </SlidebarOpenLink>
        ) : (
          desc
        )}
      </TableCell>
      <TableCell slim={!simple} className="whitespace-nowrap text-right">
        <Money zero={false} none={none}>
          {line.revenue ? line.revenue.amount : 0}
        </Money>
      </TableCell>
      {hasPermission(Permission.ViewExpenses) && (
        <TableCell slim={!simple} className="text-right">
          <Money zero={false} none={none}>
            {line.expense ? line.expense.amount : 0}
          </Money>
        </TableCell>
      )}
    </TableRow>
  );
}

export function Group({
  revenue,
  expense,
  name,
  padding = true,
  border = true,
  simple,
}: {
  revenue?: string;
  expense?: string;
  border?: boolean;
  name: React.ReactNode;
  padding?: boolean;
  simple: boolean;
}) {
  let classes = 'text-right';
  const hasPermission = useHasPermission();

  if (border) {
    classes += 'border-b-2 border-gray';
  }

  if (padding) {
    //classes += ' pt-8';
  }

  return (
    <TableRow>
      <TableCell slim={!simple} className={classes + ' font-semibold text-gray-600 text-right'}>
        {name}:
      </TableCell>
      <TableCell slim={!simple} className={classes}>
        <div className="pl-4">
          <Money zero={false} none={none}>
            {revenue}
          </Money>
        </div>
      </TableCell>
      {hasPermission(Permission.ViewExpenses) && (
        <TableCell slim={!simple} className={classes}>
          <div className="pl-4">
            <Money zero={false} none={none}>
              {expense}
            </Money>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
