import JobBadge from 'client/global/components/workflow/JobBadge';
import ProviderCombinedLine from 'client/portal/provider/job/ProviderCombinedLine';
import { ProviderJobFragment } from 'client/portal/provider/job/ProviderJobFragment';
import { ProviderGroup, ProviderLine } from 'client/portal/provider/job/ProviderLine';
import * as React from 'react';
import {
  JobProperty,
  JobStatus,
  PerformableProperty,
  VendorJobAccountingDocument,
  VendorOrderAccountingJobFragment,
} from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import ProviderIcon from 'shared/icons/ProviderIcon';
import SubItemIcon from 'shared/icons/SubItemIcon';

type JobField = Pick<JobProperty, 'id' | 'display'> & { property: Pick<PerformableProperty, 'id' | 'name'> };

interface JobAccountingFragmentProps {
  job?: VendorOrderAccountingJobFragment;
  orderId: string;
  steps?: VendorOrderAccountingJobFragment[];
  simple?: boolean;
}

export default function ProviderJobAccountingFragment({
  job,
  orderId,
  simple = false,
  steps = [],
}: JobAccountingFragmentProps) {
  const {
    order: { orderLines },
  } = useQueryHook(VendorJobAccountingDocument, { orderId });
  const orderJobLines = orderLines.filter((line) => (!job?.id && !line.jobId) || line.jobId === job?.id);

  const fields = new Map<string, JobField>();
  (job?.properties || []).forEach((p) => fields.set(p.property.id, p));
  const lines = [] as ProviderCombinedLine[];
  const mapped: string[] = [];

  for (const line of orderJobLines) {
    if (mapped.includes(line.id)) {
      continue;
    }

    mapped.push(line.id);

    const similar = orderJobLines.filter((l) => {
      if (l.id === line.id || l.expense === line.expense || mapped.includes(l.id)) {
        return false;
      }

      if (line.fieldId) {
        return l.fieldId === line.fieldId;
      }

      if (line.actionId) {
        return l.actionId === line.actionId;
      }

      if (line.eventId) {
        return l.eventId === line.eventId;
      }

      return l.description === line.description && l.providerId !== line.providerId;
    });

    const opposite = similar.length === 1 ? similar[0] : undefined;

    if (opposite) {
      mapped.push(opposite.id);
    }

    lines.push({
      id: `${line.id}-${opposite?.id}`,
      revenue: line.expense ? opposite : line,
      fieldId: line.fieldId,
      fieldName: fields.get(line.fieldId)?.property.name,
    });
    fields.delete(line.fieldId);
  }

  const jobLines = simple
    ? lines
    : [...fields.values()]
        .map(
          (field) =>
            ({
              id: field.id,
              fieldId: field.id,
              fieldName: field.property.name,
              fieldValue: field.display,
            } as ProviderCombinedLine)
        )
        .concat(lines);

  if (jobLines.length === 0) {
    return <></>;
  }

  const revenue = jobLines.reduce((total, line) => total + parseFloat(line.revenue?.amount || '0'), 0).toFixed(2);

  const multipleRevenue = jobLines.filter((l) => l.revenue).length > 1;

  return (
    <>
      {!simple && (
        <tr>
          <td scope="col" colSpan={3}>
            <div className="p-3 border-b-2 border-b-gray-200 border-t-gray-100">
              {job ? <ProviderJobFragment job={job} /> : <h1 className="font-bold">Miscellaneous</h1>}
            </div>
          </td>
        </tr>
      )}
      {steps.map((job) => (
        <tr key={job.id} className={job.status === JobStatus.Pending ? '' : ''}>
          <td scope="col" colSpan={3}>
            <div className="p-3 border-b-2 border-b-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-6 text-gray-500">
                  <SubItemIcon />
                </div>
                <div className="flex items-center space-x-2 flex-1">
                  <JobBadge job={job} />
                  <div className="font-bold">{job.performable.internalName}</div>
                </div>
                <div className="flex items-center text-sm text-opacity-60 mx-2">
                  #{job.id}
                  <div className="icon-sm mx-2">
                    <ProviderIcon />
                  </div>
                  {job.assignee ? job.assignee.company : job.user ? job.user.name : 'Unclaimed'}
                </div>
              </div>
            </div>
          </td>
        </tr>
      ))}
      {jobLines.map((line) => (
        <ProviderLine key={line.id} line={line} simple={simple} />
      ))}
      {multipleRevenue && (
        <ProviderGroup name={'Job Total'} revenue={revenue} padding={false} border={false} simple={simple} />
      )}
    </>
  );
}
