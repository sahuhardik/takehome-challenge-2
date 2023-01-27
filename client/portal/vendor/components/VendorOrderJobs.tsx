import { SlidebarOpenLink } from 'client/global/components/button/SlidebarOpenButton';
import { LinkStyle } from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import JobAccountingFragment from 'client/portal/vendor/components/JobAccountingFragment';
import { JobFragment } from 'client/portal/vendor/components/JobFragment';
import { Line } from 'client/portal/vendor/components/Line';
import VendorInvoiceAddPayment from 'client/portal/vendor/components/VendorInvoiceAddPayment';
import dayjs from 'dayjs';
import * as React from 'react';
import { Permission, VendorOrderAccountingDocument, VendorOrderAccountingJobFragment } from 'shared/generated';
import { useQueryHook, useQueryPromise } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import { useHasPermission } from 'shared/UserState';
import Money from 'shared/utilities/Money';

export default function VendorOrderJobs({ orderId, vendorId }: { orderId: string; vendorId: string }) {
  const {
    order: { jobs, revenue, expense, orderLines, unpaidBalance, payments, invoice },
  } = useQueryHook(VendorOrderAccountingDocument, { orderId });
  const hasPermission = useHasPermission();

  const refresh = useQueryPromise(VendorOrderAccountingDocument);

  const misc = orderLines.filter((l) => !l.jobId);

  return (
    <Table simple border round className="mt">
      <TableHead>
        <TableRow>
          <TableHeadCell className="w-full">Description</TableHeadCell>
          <TableHeadCell className="text-right">Revenue</TableHeadCell>
          {hasPermission(Permission.ViewExpenses) && <TableHeadCell className="text-right">Expense</TableHeadCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {jobs
          .filter((j) => j.performable && !j.parentId)
          .map((job: VendorOrderAccountingJobFragment, index) => (
            <JobAccountingFragment
              job={job}
              key={index}
              vendorId={vendorId}
              orderId={orderId}
              steps={jobs.filter((child) => child.parentId && child.root?.id === job.id)}
            />
          ))}
        {jobs
          .filter((j) => j.name)
          .map((j) => (
            <TableRow key={j.id}>
              <TableCell slim colSpan={3}>
                <JobFragment job={j} vendorId={vendorId} orderId={orderId} />
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
              <Line
                key={line.id}
                line={{
                  id: line.id,
                  revenue: line.expense ? undefined : line,
                  expense: line.expense ? line : undefined,
                }}
              />
            ))}
          </>
        )}
      </TableBody>
      <TableFooter>
        <TableRow color="bg-gray-200">
          <TableCell className="text-right" slim>
            Order Total:
          </TableCell>
          <TableCell className="text-right" slim>
            <Money>{revenue}</Money>
          </TableCell>
          {hasPermission(Permission.ViewExpenses) && (
            <TableCell className="text-right" slim>
              <Money>{expense}</Money>
            </TableCell>
          )}
        </TableRow>
        {hasPermission(Permission.ViewExpenses) &&
          payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell slim className="text-right font-normal">
                {payment.source?.name || 'Manual Payment'}{' '}
                <span className="text-quiet text-xs">({dayjs(payment.created).format('MM/DD/YYYY')})</span>
                {payment.notes && <div className="text-sm text-quiet">{payment.notes}</div>}
                {!payment.capturedDate && <span className="text-quiet text-xs text-red-600">{` (Hold)`}</span>}
              </TableCell>
              <TableCell slim className="text-right font-normal">
                <Money>{payment.captured || payment.authorized}</Money>
              </TableCell>
              <TableCell slim />
            </TableRow>
          ))}
        {hasPermission(Permission.ViewExpenses) && (
          <>
            <TableRow>
              <TableCell className="text-right" slim>
                <SlidebarOpenLink icon={<AddIcon />} text="Add Payment" style={LinkStyle.BOLD}>
                  <VendorInvoiceAddPayment
                    invoice={invoice}
                    onAdd={async () => {
                      await refresh({ orderId });
                    }}
                  />
                </SlidebarOpenLink>
              </TableCell>
              <TableCell colSpan={2} slim />
            </TableRow>
            <TableRow color={parseFloat(unpaidBalance) > 0 ? 'bg-red-100' : 'bg-green-100'}>
              <TableCell className="text-right" slim>
                Balance:
              </TableCell>
              <TableCell className="text-right" slim>
                <Money>{unpaidBalance}</Money>
              </TableCell>
              <TableCell slim />
            </TableRow>
          </>
        )}
      </TableFooter>
    </Table>
  );
}
