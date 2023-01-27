import JobBadge from 'client/global/components/workflow/JobBadge';
import dayjs from 'dayjs';
import * as React from 'react';
import { ProviderOrderAccountingJobFragment } from 'shared/generated';
import ProviderIcon from 'shared/icons/ProviderIcon';
import ScheduleIcon from 'shared/icons/ScheduleIcon';

export function ProviderJobFragment({ job }: { job: ProviderOrderAccountingJobFragment }) {
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
        </div>
      )}
      {job.performable && !job.onsite && (
        <>
          <div className="mt-2 sm:flex sm:justify-between">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2">
                <div className="font-bold">{job.performable.internalName}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-opacity-60 sm:mt-0">
              <JobBadge job={job} />
            </div>
          </div>

          <div className="mt-2 sm:flex sm:justify-between">
            <div className="flex items-center text-sm text-opacity-60 mx-2">
              #{job.id}
              <div className="icon-sm mx-2">
                <ProviderIcon />
              </div>
              {job.assignee ? job.assignee.company : job.user ? job.user.name : 'Unclaimed'}
            </div>
            <div className="mt-2 flex items-center text-sm text-opacity-60 sm:mt-0">-</div>
          </div>
        </>
      )}
      {job.performable && job.onsite > 0 && (
        <>
          <div className="mt-2 sm:flex sm:justify-between">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2">
                <div className="font-bold">{job.performable.internalName}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-opacity-60 sm:mt-0">
              <JobBadge job={job} />
            </div>
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
              <div>{job.start ? dayjs(job.start).format('MM/DD h:mm A') : 'Unscheduled'}</div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
