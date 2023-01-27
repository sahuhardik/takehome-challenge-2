import ActivityLog from 'client/global/components/model/ActivityLog';
import Card from 'client/global/components/tailwind/Card';
import Center from 'client/global/components/tailwind/Center';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import VendorTodoActions from 'client/portal/vendor/components/todo/VendorTodoActions';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { VendorActivityDocument, VendorDashboardTodosDocument, VendorUnclaimedJobsDocument } from 'shared/generated';
import { useQueryHook, useQueryPromise } from 'shared/Graph';

export default function VendorDashboard() {
  const { vendorId } = useParams();

  const query = useQueryHook(VendorActivityDocument, { vendorId }, 'cache-and-network');
  const todos = useQueryHook(VendorDashboardTodosDocument, {}, 'cache-and-network');
  const unclaimedJobs = useQueryHook(VendorUnclaimedJobsDocument, { vendorId }, 'cache-and-network');

  const unclaimedJobsRefresh = useQueryPromise(VendorUnclaimedJobsDocument, 'network-only');
  const todosRefresh = useQueryPromise(VendorDashboardTodosDocument, 'network-only');

  return (
    <Center padding>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-lg font-medium mb-2">Activity Log</div>
          <Card>
            <div className="overflow-y-scroll scrollbar h-96">
              <ActivityLog
                buyerUrlPrefix={`/ui/vendor/${vendorId}/customers`}
                orderUrlPrefix={`/ui/vendor/${vendorId}/order`}
                activities={query.member.activity}
                buyer
                job
                order
              />
            </div>
          </Card>
        </div>
        <div>
          <div className="flex items-center justify-between relative z-10">
            <div className="text-lg font-medium mb-2">My Tasks</div>
          </div>

          <Card>
            <div className="overflow-y-scroll scrollbar h-96">
              {todos.profile.todos.length === 0 && (
                <div className="flex h-full items-center justify-center">
                  You do not have any outstanding tasks assigned to you.
                </div>
              )}
              {todos.profile.todos.length > 0 && (
                <Table round border className="min-h-full">
                  <TableHead>
                    <TableRow>
                      <TableHeadCell>Name</TableHeadCell>
                      <TableHeadCell></TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {todos.profile.todos.map((todo) => (
                      <TableRow key={todo.id}>
                        <TableCell className="w-full">{todo.name}</TableCell>
                        <TableCell>
                          <VendorTodoActions job={todo} vendorId={vendorId} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </div>
        <div>
          <div className="text-lg font-medium mb-2">Unclaimed Jobs</div>
          <Card>
            <div className="overflow-y-scroll scrollbar h-96">
              {unclaimedJobs.vendor.jobsUnclaimed.length === 0 && (
                <div className="flex h-full items-center justify-center">
                  There are no outstanding tasks waiting to be claimed.
                </div>
              )}
              {unclaimedJobs.vendor.jobsUnclaimed.length > 0 && (
                <Table round border className="min-h-full">
                  <TableHead>
                    <TableRow>
                      <TableHeadCell>Name</TableHeadCell>
                      <TableHeadCell></TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {unclaimedJobs.vendor.jobsUnclaimed.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="w-full">{job.name}</TableCell>
                        <TableCell>
                          <VendorTodoActions
                            vendorId={vendorId}
                            job={job}
                            onAction={async () => {
                              await Promise.all([todosRefresh(), unclaimedJobsRefresh({ vendorId })]);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Center>
  );
}
