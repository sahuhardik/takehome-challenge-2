import { TableCell, TableRow } from 'client/global/components/tailwind/Table';
import ProviderCombinedLine from 'client/portal/provider/job/ProviderCombinedLine';
import * as React from 'react';

export function ProviderLine({ line, simple = false }: { simple?: boolean; line: ProviderCombinedLine }) {
  let field = line.fieldName;
  const desc = line.revenue?.description || line.fieldValue;

  if (desc === field) {
    field = null;
  }

  return (
    <TableRow key={line.id} secondary={!simple} hover>
      <TableCell slim={!simple} className="break-all" colSpan={2}>
        {!simple && field && <div className="font-semibold">{field}</div>}
        {desc}
      </TableCell>
    </TableRow>
  );
}

export function ProviderGroup({
  name,
  padding = true,
  border = true,
  simple,
}: {
  revenue?: string;
  border?: boolean;
  name: React.ReactNode;
  padding?: boolean;
  simple: boolean;
}) {
  let classes = 'text-right';

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
    </TableRow>
  );
}
