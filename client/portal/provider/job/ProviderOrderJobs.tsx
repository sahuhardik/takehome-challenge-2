import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import ProviderJobAccountingFragment from 'client/portal/provider/job/ProviderJobAccountingFragment';
import { ProviderJobFragment } from 'client/portal/provider/job/ProviderJobFragment';
import { ProviderLine } from 'client/portal/provider/job/ProviderLine';
import * as React from 'react';
import { ProviderOrderAccountingDocument, ProviderOrderAccountingJobFragment } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

export default function ProviderOrderJobs({ orderId }: { orderId: string }) {
  const {
    order: { jobs, orderLines },
  } = useQueryHook(ProviderOrderAccountingDocument, { orderId });

  const misc = orderLines.filter((l) => !l.jobId);

  return (
    <Table simple border round className="mt">
      <TableHead>
        <TableRow>
          <TableHeadCell className="w-full">Description</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {jobs
          .filter((j) => j.performable && !j.parentId)
          .map((job: ProviderOrderAccountingJobFragment, index) => (
            <ProviderJobAccountingFragment
              job={job}
              key={index}
              orderId={orderId}
              steps={jobs.filter((child) => child.parentId === job.id)}
            />
          ))}
        {jobs
          .filter((j) => j.name)
          .map((j) => (
            <TableRow key={j.id}>
              <TableCell slim colSpan={3}>
                <ProviderJobFragment job={j} />
              </TableCell>
            </TableRow>
          ))}
        {misc.length > 0 && (
          <>
            <TableRow>
              <TableCell colSpan={3} className="border-t border-b-2 border-b-gray-200 border-t-gray-100">
                <h1 className="font-bold">Miscellaneous</h1>
              </TableCell>
            </TableRow>
            {misc.map((line) => (
              <ProviderLine
                key={line.id}
                line={{
                  id: line.id,
                  revenue: line.expense ? undefined : line,
                }}
              />
            ))}
          </>
        )}
      </TableBody>
    </Table>
  );
}
