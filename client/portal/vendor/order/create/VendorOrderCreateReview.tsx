import { State, useState } from '@hookstate/core';
import Center from 'client/global/components/tailwind/Center';
import Link from 'client/global/components/tailwind/Link';
import SpinnerLoader from 'client/global/components/tailwind/SpinnerLoader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { useBlocker } from 'client/global/hooks/useBlocker';
import { VendorJobDetailsProperty } from 'client/portal/vendor/components/VendorJobDetails';
import VendorOrderDetails from 'client/portal/vendor/components/VendorOrderDetails';
import { OrderCreateState } from 'client/portal/vendor/order/create/VendorOrderCreateCommon';
import dayjs from 'dayjs';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  PerformableType,
  ScheduleUpdate,
  VendorOrderReviewDocument,
  VendorOrderSubmitDocument,
  VendorProvidersDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import EditIcon from 'shared/icons/EditIcon';
import ProviderIcon from 'shared/icons/ProviderIcon';
import ScheduleIcon from 'shared/icons/ScheduleIcon';
import Money from 'shared/utilities/Money';

export default function VendorOrderCreateReview({ state }: { state: State<OrderCreateState> }) {
  const scoped = useState(state);

  const { vendorId } = useParams();

  const { vendor } = useQueryHook(VendorProvidersDocument, { vendorId }, 'cache-and-network');
  const { order } = useQueryHook(VendorOrderReviewDocument, { orderId: scoped.orderId.get() }, 'cache-and-network');
  const submit = useMutationPromise(VendorOrderSubmitDocument);

  const navigate = useNavigate();

  const onSubmit = (quote: boolean) => async () => {
    await submit({ orderId: order.id, schedule: schedules, confirm: !quote, quote: quote });

    window.localStorage.removeItem('vendor-shop-create');

    allowNavigate.set(true);

    navigate(`/ui/vendor/${vendorId}/order/view/${order.id}`);
  };

  const schedules: ScheduleUpdate[] = scoped
    .get()
    .services.filter((s) => !!s.scheduled)
    .map((s) => ({
      start: s.scheduled,
      providerId: s.providerId,
      locked: s.locked,
      notifyProvider: true,
      notifyBuyer: true,
      group: s.group,
      jobId: s.id,
    }));

  const allowNavigate = useState(false);

  useBlocker((tx) => {
    if (
      allowNavigate.get() ||
      tx.location.pathname.includes('order/create') ||
      confirm('You have not created the order, are you sure you want to leave?')
    ) {
      allowNavigate.set(true);

      tx.retry();
    }
  }, !allowNavigate.get());

  return (
    <Center padding>
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex items-center justify-between bg-accent">
              <div className="text-lg leading-6 font-medium text-gray-900">Order Details</div>
            </div>
            <SpinnerLoader>
              <VendorOrderDetails
                address
                orderId={scoped.orderId.get()}
                onAddressEdit={() => navigate('../address')}
                onCustomersEdit={() => navigate('../customer')}
                onMetadataEdit={() => navigate('../details')}
                onRequestedEdit={() => navigate('../schedule')}
              />
            </SpinnerLoader>
          </div>
        </div>
        <div className="col-span-3 pb">
          <Table round card>
            <TableHead>
              <TableRow>
                <TableHeadCell>Service</TableHeadCell>
                <TableHeadCell>Configuration</TableHeadCell>
                <TableHeadCell>Revenue</TableHeadCell>
                <TableHeadCell>Provider</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.jobs
                .filter((j) => j.performable && j.performable.type !== PerformableType.Task)
                .map((job) => {
                  const scheduled = schedules.find((s) => s.jobId === job.id);

                  return (
                    <TableRow key={job.id}>
                      <TableCell>
                        <Link icon={<EditIcon />} to="../services">
                          {job.performable.name}
                        </Link>
                      </TableCell>

                      <TableCell>
                        {job.properties.length ? (
                          <div className="space-y-2">
                            {job.properties.map((p) => (
                              <div key={p.property.id}>
                                <strong>{p.property.name}</strong>: <VendorJobDetailsProperty display={p.display} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>N/A</div>
                        )}
                      </TableCell>

                      <TableCell>
                        <Money>{job.revenue}</Money>
                      </TableCell>
                      <TableCell>
                        <div className="mt-2 flex items-center">
                          <div className="icon-sm mr-2">
                            <ProviderIcon />
                          </div>
                          {vendor.providers.find((p) => p.member.id === scheduled?.providerId)?.member.company ||
                            'Unassigned'}
                        </div>
                        {job.onsite > 0 && (
                          <div className="mt-2 flex items-center">
                            <div className="icon-sm mr-2">
                              <ScheduleIcon />
                            </div>
                            <div>{scheduled ? dayjs(scheduled.start).format('M/D HH:mm A') : 'Unscheduled'}</div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center pt">
            <div>
              <strong>Total:</strong> <Money>{order.revenue}</Money>
            </div>
            <PromiseButton onClick={onSubmit(true)} style={ButtonStyle.SECONDARY}>
              Send Quote
            </PromiseButton>
            <PromiseButton onClick={onSubmit(false)}>Create Order</PromiseButton>
          </div>
        </div>
      </div>
    </Center>
  );
}
