import { useState } from '@hookstate/core';
import { Persistence } from '@hookstate/persistence';
import NavigationButton from 'client/global/components/button/NavigationButton';
import MapAppointment from 'client/global/components/map/MapAppointment';
import Card from 'client/global/components/tailwind/Card';
import Link from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import Tabs from 'client/global/components/tailwind/Tabs';
import Slidebar, { SlidebarContent } from 'client/global/layout/slidebar/Slidebar';
import VendorOrderJobs from 'client/portal/vendor/components/VendorOrderJobs';
import VendorOrderMetadata from 'client/portal/vendor/components/VendorOrderMetadata';
import VendorOrderJob from 'client/portal/vendor/order/job/VendorOrderJob';
import dayjs from 'dayjs';
import * as React from 'react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PopupView from 'shared/components/tailwind/Popup';
import { Health, JobStage, OrderAlert, VendorJobsQuery, VendorOrderStagesDocument } from 'shared/generated';
import { useQueryHook, useQueryPromise } from 'shared/Graph';
import ContractIcon from 'shared/icons/ContractIcon';
import ExpandIcon from 'shared/icons/ExpandIcon';
import JobStageIcon from 'shared/icons/JobStageIcon';

function OrderTabs({ orderId }: { orderId: string }) {
  const { vendorId } = useParams();

  return (
    <Tabs
      padding={false}
      router={false}
      tabs={[
        {
          name: 'Order',
          useActions: [
            <NavigationButton link={`/ui/vendor/${vendorId}/order/view/${orderId}`} key="open">
              Open Order
            </NavigationButton>,
          ],
          useElement: (
            <div className="p">
              <VendorOrderMetadata orderId={orderId} />
            </div>
          ),
          key: 'accordian_order',
        },
        {
          useElement: <VendorOrderJobs orderId={orderId} vendorId={vendorId} />,
          name: 'Jobs',
          key: 'accordian_jobs',
        },
      ]}
    />
  );
}

function OrderPerformable({
  performable,
  order,
}: {
  performable: string;
  order: VendorJobsQuery['vendor']['orders'][0];
}) {
  const job = order.jobs.find((j) => j.performable?.shortName === performable);

  const show = useState(false);

  if (!job) {
    return (
      <TableCell key={performable}>
        <span className="select-none">-</span>
      </TableCell>
    );
  }

  let color;

  switch (job.health) {
    case Health.Bad:
      color = 'bg-red-50';
      break;
    case Health.Good:
      color = 'bg-green-50';
      break;
    case Health.Ok:
      color = 'bg-yellow-50';
      break;
  }

  const status = (
    <div className={`flex flex-col w-full h-full items-center justify-center space-y-1`}>
      <div className="icon relative">
        <JobStageIcon stage={job.stage} />
        {job.alert && (
          <span className="absolute top-0 right-0 block h-2.5 w-2.5 transform -translate-y-1/2 translate-x-1/2 rounded-full ring-2 ring-white bg-red-600"></span>
        )}
      </div>
      {job.start && <div className="text-xs">{dayjs(job.start).format('M/D')}</div>}
    </div>
  );

  return (
    <>
      <TableCell className={`text-center ${color}`} onClick={() => show.set(true)}>
        <PopupView activator={status} hover={1000}>
          <Card>
            <div className="flex items-center space-x-2">
              <div className="icon">
                <JobStageIcon stage={job.stage} />
              </div>
              <div>{job.stageName}</div>
            </div>
            <p className="text-sm text-gray-600">{job.stageDescription}</p>
          </Card>
        </PopupView>
      </TableCell>
      <Slidebar show={show.get()} onClose={() => show.set(false)}>
        <MapAppointment address={order.address} date={new Date(job.start)} />
        <SlidebarContent>
          <VendorOrderJob jobId={job.id} />
        </SlidebarContent>
      </Slidebar>
    </>
  );
}

function OrderRow({
  order,
  todos,
  fields,
  performables,
  bg = true,
}: {
  bg?: boolean;
  todos: boolean;
  order: VendorJobsQuery['vendor']['orders'][0];
  fields: VendorJobsQuery['vendor']['fields'];
  performables: string[];
}) {
  let rowColor;

  if (bg) {
    if (order.jobs.every((j) => j.health === Health.Good)) {
      rowColor = 'bg-green-50';
    } else if (order.jobs.some((j) => j.health === Health.Bad)) {
      rowColor = 'bg-red-50';
    } else if (order.jobs.some((j) => j.health === Health.Ok)) {
      rowColor = 'bg-yellow-50';
    } else if (order.jobs.some((j) => j.stage === JobStage.Pending)) {
      rowColor = 'bg-gray-50';
    }
  }

  const orderTodos = order.jobs.filter((j) => !!j.name);

  let todoColor;

  if (orderTodos.every((j) => j.health === Health.Good)) {
    todoColor = 'bg-green-50';
  } else if (orderTodos.some((j) => j.health === Health.Bad)) {
    todoColor = 'bg-red-50';
  } else if (orderTodos.some((j) => j.health === Health.Ok)) {
    todoColor = 'bg-yellow-50';
  } else if (orderTodos.some((j) => j.stage === JobStage.Pending)) {
    todoColor = 'bg-gray-50';
  }

  const expanded = useState(false);

  return (
    <>
      <TableRow color={rowColor} lazy>
        <TableCell>
          <div className="flex items-center space-x">
            <div className="icon-lg cursor-pointer select-none" onClick={() => expanded.set((e) => !e)}>
              {expanded.get() ? <ContractIcon /> : <ExpandIcon />}
            </div>
            <div>
              <Link to={`../view/${order.id}`}>
                #{order.id}: <span className="font-semibold">{order.address.line1}</span>{' '}
                <span className="text-xs italic">
                  {order.address.city} {order.address.state}
                </span>
              </Link>
              <div className="text-xs text-opacity-60 flex space-x-2">
                <div>{order.buyer.member.company}</div>
                <div className="border-l border-black border-opacity-20 pl-2">Jobs: {order.jobs.length}</div>
              </div>
            </div>
          </div>
        </TableCell>
        {fields.map((field) => (
          <TableCell key={field.id}>{order.metadata[field.id]?.value || '-'}</TableCell>
        ))}
        {todos &&
          (orderTodos.length > 0 ? (
            <TableCell className={todoColor}>
              <div className={`flex w-full h-full items-center justify-center`}>
                {orderTodos.filter((t) => t.stage === JobStage.Completed).length}/{orderTodos.length}
              </div>
            </TableCell>
          ) : (
            <TableCell>
              <span className="select-none">-</span>
            </TableCell>
          ))}
        {performables.map((p) => (
          <OrderPerformable key={p} performable={p} order={order} />
        ))}
      </TableRow>
      {expanded.get() && (
        <TableRow>
          <TableCell colSpan={performables.length + fields.length + (todos ? 1 : 0) + 1}>
            <OrderTabs orderId={order.id} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function TableRows({
  title,
  orders,
  fields,
  alert,
  newOrders,
}: {
  alert?: boolean;
  title: string;
  newOrders?: boolean;
  orders: VendorJobsQuery['vendor']['orders'];
  fields: VendorJobsQuery['vendor']['fields'];
}) {
  const uniquePerformables = Array.from(
    new Set(orders.map((o) => o.jobs.map((j) => j.performable?.shortName).filter((j) => !!j)).flat())
  ).sort((a, b) => a.localeCompare(b));

  const todos = orders.some((o) => o.jobs.some((j) => !!j.name));

  let bg;
  let text;

  if (alert) {
    bg = 'bg-red-700';
    text = 'text-white';
  } else if (newOrders) {
    bg = 'bg-blue-500';
    text = 'text-white';
  }

  return (
    <Table card>
      <TableHead>
        <TableRow>
          <TableHeadCell className={`w-full ${bg}`}>
            <div className={`font-bold ${text}`}>{title}</div>
          </TableHeadCell>
          {fields.map((field) => (
            <TableHeadCell key={field.id} className={bg}>
              <span className={text}>{field.name}</span>
            </TableHeadCell>
          ))}
          {todos && (
            <TableHeadCell className={bg}>
              <span className={text}>Todo</span>
            </TableHeadCell>
          )}
          {uniquePerformables.map((p) => (
            <TableHeadCell key={p} className={bg}>
              <div className={`whitespace-nowrap ${text}`}>{p}</div>
            </TableHeadCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {orders.map((order) => (
          <OrderRow
            order={order}
            key={order.id}
            todos={todos}
            performables={uniquePerformables}
            fields={fields}
            bg={!alert}
          />
        ))}
      </TableBody>
    </Table>
  );
}

export default function VendorOrderStages({ asc }: { asc: boolean }) {
  const { vendorId } = useParams();

  const {
    vendor: { orders, fields },
  } = useQueryHook(VendorOrderStagesDocument, { vendorId }, 'cache-and-network');

  const refresh = useQueryPromise(VendorOrderStagesDocument);

  useEffect(() => {
    // TODO: query using a last modified timestamp and append changes
    const interval = setInterval(() => {
      refresh({ vendorId });
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  });

  const showFields = fields.filter((f) => f.showOnOrderList);

  const state = useState({
    days: true,
  });

  state.attach(Persistence('vendor-order-list'));

  const intervals = new Map<string, VendorJobsQuery['vendor']['orders'][0][]>();

  let intervalFormat = (current: Date, order: Date) => {
    const diff = dayjs(current).diff(order, 'week');

    if (diff === 0) {
      return 'This Week';
    }

    return `${diff} week${diff > 1 ? 's' : ''} ago`;
  };

  if (state.days.get()) {
    intervalFormat = (current: Date, order: Date) => {
      const diff = dayjs(current).diff(order, 'day');

      if (diff === 0) {
        return 'Today';
      }

      return `${diff} day${diff > 1 ? 's' : ''} ago`;
    };
  }

  if (asc) {
    orders.sort((a, b) => (a.created > b.created ? 1 : -1));
  } else {
    orders.sort((a, b) => (a.created > b.created ? -1 : 1));
  }

  const alerts = [];
  const newOrders = [];

  for (const order of orders) {
    if (order.alert === OrderAlert.New) {
      newOrders.push(order);

      continue;
    }

    if (order.alert) {
      alerts.push(order);

      continue;
    }

    const interval = intervalFormat(new Date(), new Date(order.created));

    if (!intervals.has(interval)) {
      intervals.set(interval, []);
    }

    intervals.get(interval).push(order);
  }

  return (
    <div>
      {newOrders.length > 0 && (
        <div className="mb">
          <TableRows title="New Orders" orders={newOrders} fields={showFields} newOrders />
        </div>
      )}
      {alerts.length > 0 && (
        <div className="mb">
          <TableRows title="Order Alerts" orders={alerts} fields={showFields} alert />
        </div>
      )}
      <div className="space-y">
        {Array.from(intervals.entries()).map(([interval, orders]) => (
          <TableRows key={interval} title={interval} orders={orders} fields={showFields} />
        ))}
      </div>
    </div>
  );
}
