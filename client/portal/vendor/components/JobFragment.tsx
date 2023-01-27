import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import JobBadge from 'client/global/components/workflow/JobBadge';
import CancelJobButton from 'client/portal/vendor/components/CancelJobButton';
import { JobAssignButton } from 'client/portal/vendor/components/JobAssignButton';
import dayjs from 'dayjs';
import * as React from 'react';
import PromiseButton from 'shared/components/button/PromiseButton';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  JobStage,
  VendorJobDeleteDocument,
  VendorJobForceCompleteDocument,
  VendorJobStatusDocument,
  VendorOrderAccountingJobFragment,
} from 'shared/generated';
import { useMutationPromise } from 'shared/Graph';
import ProviderIcon from 'shared/icons/ProviderIcon';
import ScheduleIcon from 'shared/icons/ScheduleIcon';
import { useUser } from 'shared/UserState';

export function JobFragment({
  job,
  vendorId,
  orderId,
}: {
  job: VendorOrderAccountingJobFragment;
  vendorId: string;
  orderId: string;
}) {
  const status = useMutationPromise(VendorJobStatusDocument);
  const deleteJob = useMutationPromise(VendorJobDeleteDocument);
  const complete = useMutationPromise(VendorJobForceCompleteDocument);
  const user = useUser();
  return (
    <>
      {!job.performable && (
        <div className="flex items-center justify-between space-x">
          <div>
            <div className="flex items-center justify-between space-x-2">
              <span>
                <JobBadge job={job} /> <strong>Todo: </strong>
                {job.name}
              </span>
            </div>
            <div className="flex items-center text-sm text-opacity-60 mt-2">
              #{job.id}
              <div className="icon-sm mx-2">
                <ProviderIcon />
              </div>
              {job.user ? job.user.name : 'Unclaimed'}
            </div>
          </div>
          <div className="space-x-2">
            {job.stage === JobStage.Unclaimed && <JobAssignButton vendorId={vendorId} jobId={job.id} label="Assign" />}

            {job.stage === JobStage.Ready && job.nextStatus && job.user?.id === user.id && (
              <PromiseButton
                onClick={async () => {
                  await status({ jobId: job.id, status: job.nextStatus });
                }}
              >
                {job.nextStatusLabel}
              </PromiseButton>
            )}

            {job.cancelable && <CancelJobButton jobId={job.id} />}

            {job.removable && (
              <PromiseButton
                style={ButtonStyle.DANGER}
                onClick={async () => {
                  await deleteJob({ jobId: job.id });
                }}
                slim
              >
                Delete
              </PromiseButton>
            )}
          </div>
        </div>
      )}
      {job.performable && !job.onsite && (
        <div className="flex items-center justify-between space-x">
          <div>
            <div className="flex items-center space-x-2">
              <JobBadge job={job} />
              <Link to={`/ui/vendor/${vendorId}/order/view/${orderId}/jobs/${job.id}`} style={LinkStyle.BOLD}>
                {job.performable.internalName}
                {job.deliverableCount > 0 && ` (${job.deliverableCount})`}
              </Link>
            </div>
            <div className="flex items-center text-sm text-opacity-60 mx-2">
              #{job.id}
              <div className="icon-sm mx-2">
                <ProviderIcon />
              </div>
              {job.assignee ? job.assignee.company : job.user ? job.user.name : 'Unclaimed'}
            </div>
          </div>
          <div className="space-x-2">
            {job.stage === JobStage.Unclaimed && <JobAssignButton vendorId={vendorId} jobId={job.id} label="Assign" />}

            {job.nextStatus && job.user?.id === user.id && (
              <PromiseButton
                onClick={async () => {
                  await status({ jobId: job.id, status: job.nextStatus });
                }}
              >
                {job.nextStatusLabel}
              </PromiseButton>
            )}

            {job.cancelable && <CancelJobButton jobId={job.id} />}

            {job.removable && (
              <PromiseButton
                style={ButtonStyle.DANGER}
                onClick={async () => {
                  await deleteJob({ jobId: job.id });
                }}
                slim
              >
                Delete
              </PromiseButton>
            )}
          </div>
        </div>
      )}
      {job.performable && job.onsite > 0 && (
        <>
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <JobBadge job={job} />
              <Link to={`/ui/vendor/${vendorId}/order/view/${orderId}/jobs/${job.id}`} style={LinkStyle.BOLD}>
                {job.performable.internalName}
                {job.deliverableCount > 0 && ` (${job.deliverableCount})`}
              </Link>
            </div>
            {(job.cancelable || job.removable || job.completable) && (
              <div className="space-x-2">
                {job.completable && (
                  <PromiseButton
                    style={ButtonStyle.QUIET}
                    onClick={async () => {
                      await complete({ jobId: job.id });
                    }}
                    slim
                  >
                    Complete
                  </PromiseButton>
                )}

                {job.cancelable && <CancelJobButton jobId={job.id} />}

                {job.removable && (
                  <PromiseButton
                    style={ButtonStyle.DANGER}
                    onClick={async () => {
                      await deleteJob({ jobId: job.id });
                    }}
                    slim
                  >
                    Delete
                  </PromiseButton>
                )}
              </div>
            )}
          </div>
          <div className="mt-2 sm:flex sm:justify-between">
            <div className="sm:flex">
              <div className="flex items-center text-sm text-opacity-60">
                #{job.id}
                <div className="icon-sm mx-2">
                  <ProviderIcon />
                </div>
                {job.assignee ? job.assignee.company : 'Unassigned'}
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-opacity-60 sm:mt-0">
              <div className="icon-sm mr-2">
                <ScheduleIcon />
              </div>
              <div className="font-medium text-base">
                {job.start ? dayjs(job.start).format('MM/DD h:mm A') : 'Unscheduled'}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
