import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import JobBadge from 'client/global/components/workflow/JobBadge';
import CombinedLine from 'client/portal/vendor/components/CombinedLine';
import { JobFragment } from 'client/portal/vendor/components/JobFragment';
import { Group, Line } from 'client/portal/vendor/components/Line';
import * as React from 'react';
import PromiseButton from 'shared/components/button/PromiseButton';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  JobProperty,
  JobStage,
  JobStatus,
  PerformableProperty,
  VendorJobAccountingDocument,
  VendorJobForceCompleteDocument,
  VendorOrderAccountingJobFragment,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import ProviderIcon from 'shared/icons/ProviderIcon';
import SubItemIcon from 'shared/icons/SubItemIcon';
import { JobAssignButton } from './JobAssignButton';

type JobField = Pick<JobProperty, 'id' | 'display'> & { property: Pick<PerformableProperty, 'id' | 'name'> };

interface JobAccountingFragmentProps {
  job?: VendorOrderAccountingJobFragment;
  vendorId: string;
  orderId: string;
  steps?: VendorOrderAccountingJobFragment[];
  simple?: boolean;
}

export default function JobAccountingFragment({
  job,
  vendorId,
  orderId,
  simple = false,
  steps = [],
}: JobAccountingFragmentProps) {
  const {
    order: { orderLines },
  } = useQueryHook(VendorJobAccountingDocument, { orderId });
  const complete = useMutationPromise(VendorJobForceCompleteDocument);
  const orderJobLines = orderLines.filter((line) => (!job?.id && !line.jobId) || line.jobId === job?.id);

  const fields = new Map<string, JobField>();
  (job?.properties || []).forEach((p) => fields.set(p.property.id, p));
  const lines = [] as CombinedLine[];
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
      expense: line.expense ? line : opposite,
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
            } as CombinedLine)
        )
        .concat(lines);

  if (jobLines.length === 0 && fields.size > 0) {
    return <></>;
  }

  const revenue = jobLines.reduce((total, line) => total + parseFloat(line.revenue?.amount || '0'), 0).toFixed(2);
  const expense = jobLines.reduce((total, line) => total + parseFloat(line.expense?.amount || '0'), 0).toFixed(2);

  const multipleExpense = jobLines.filter((l) => l.expense).length > 1;
  const multipleRevenue = jobLines.filter((l) => l.revenue).length > 1;

  return (
    <>
      {(!simple || (jobLines.length == 0 && fields.size === 0)) && (
        <tr>
          <td scope="col" colSpan={3}>
            <div className="p-3 border-b-2 border-b-gray-200 border-t-gray-100">
              {job ? (
                <JobFragment job={job} vendorId={vendorId} orderId={orderId} />
              ) : (
                <h1 className="font-bold">Miscellaneous</h1>
              )}
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
                  <Link to={`/ui/vendor/${vendorId}/order/view/${orderId}/jobs/${job.id}`} style={LinkStyle.BOLD}>
                    {job.performable.internalName}
                    {job.deliverableCount > 0 && `(${job.deliverableCount})`}
                  </Link>
                </div>
                <div className="flex items-center text-sm text-opacity-60 mx-2 space-x-2">
                  <div>
                    #{job.id}
                    <div className="icon-sm mx-2">
                      <ProviderIcon />
                    </div>
                    {job.assignee ? job.assignee.company : job.user ? job.user.name : 'Unclaimed'}
                  </div>
                  {job.stage === JobStage.Unclaimed ? (
                    <JobAssignButton vendorId={vendorId} jobId={job.id} label="Assign" />
                  ) : (
                    job.completable && (
                      <PromiseButton
                        style={ButtonStyle.SECONDARY}
                        onClick={async () => {
                          await complete({ jobId: job.id });
                        }}
                        slim
                      >
                        Complete
                      </PromiseButton>
                    )
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      ))}
      {jobLines.map((line) => (
        <Line key={line.id} line={line} simple={simple} />
      ))}
      {(multipleExpense || multipleRevenue) && (
        <Group name={'Job Total'} revenue={revenue} expense={expense} padding={false} border={false} simple={simple} />
      )}
    </>
  );
}
