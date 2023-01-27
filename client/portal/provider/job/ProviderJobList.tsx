import Center from 'client/global/components/tailwind/Center';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import JobBadge from 'client/global/components/workflow/JobBadge';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { JobStatus, ProviderJobsDocument } from 'shared/generated';
import { useQueryHook, useQueryPromise } from 'shared/Graph';
import ProviderJobClaim from 'shared/portal/provider/ProviderJobClaim';

export default function ProviderJobList() {
  const { providerMemberId } = useParams();

  const resp = useQueryHook(ProviderJobsDocument, { providerId: providerMemberId }, 'cache-and-network');
  const refresh = useQueryPromise(ProviderJobsDocument);

  const navigate = useNavigate();

  const types = new Map<string, typeof resp.provider.jobsAwaiting>();

  for (const job of [...resp.provider.jobsAwaiting, ...resp.provider.jobsFuture]) {
    if (!types.has(job.performable.name)) {
      types.set(job.performable.name, []);
    }

    types.get(job.performable.name).push(job);
  }

  return (
    <Center padding>
      <div className="space-y">
        {Array.from(types.entries()).map(([type, jobs]) => (
          <div key={type}>
            <div className="text-xl font-medium mb-2">{type}</div>
            <Table card border round>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>ID</TableHeadCell>
                  <TableHeadCell>Order</TableHeadCell>
                  <TableHeadCell>Configuration</TableHeadCell>
                  <TableHeadCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow
                    hover={job.status !== JobStatus.Pending}
                    key={job.id}
                    onClick={job.status !== JobStatus.Pending ? () => navigate(`./${job.id}`) : undefined}
                  >
                    <TableCell>
                      <JobBadge job={job} />
                    </TableCell>
                    <TableCell>#{job.id}</TableCell>
                    <TableCell className="w-96">
                      {job.order.buyer.member.company}
                      <br />
                      <span className="font-semibold">{job.order.address.addressFirst}</span>{' '}
                      <span className="text-xs italic">{job.order.address.addressSecond}</span>
                    </TableCell>
                    <TableCell>
                      {job.root.fields
                        .filter((f) => f.shouldDisplay)
                        .map((field, index) => (
                          <>
                            {index > 0 && ','}
                            <strong className="ml-2 font-semibold">{field.title}</strong>
                            <span className="ml-1">{field.display}</span>
                          </>
                        ))}
                    </TableCell>
                    <TableCell>
                      {resp.provider.canClaimJobs && (
                        <ProviderJobClaim
                          job={{ id: job.id, user: job.user, status: job.status }}
                          onClaimed={async () => {
                            await refresh({ providerId: providerMemberId });
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
    </Center>
  );
}
