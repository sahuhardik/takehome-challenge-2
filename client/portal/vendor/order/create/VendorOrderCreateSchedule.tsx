import { State, useState } from '@hookstate/core';
import NavigationButton from 'client/global/components/button/NavigationButton';
import { SlidebarCloseButton, SlidebarOpenLink } from 'client/global/components/button/SlidebarOpenButton';
import Requested from 'client/global/components/Requested';
import Card from 'client/global/components/tailwind/Card';
import Center from 'client/global/components/tailwind/Center';
import { LinkStyle } from 'client/global/components/tailwind/Link';
import SelectGrid from 'client/global/components/tailwind/SelectGrid';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { SlidebarContent, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import { OrderCreateState } from 'client/portal/vendor/order/create/VendorOrderCreateCommon';
import VendorScheduleCalendar from 'client/portal/vendor/schedule/VendorScheduleCalendar';
import { VendorScheduleAppointment } from 'client/portal/vendor/schedule/VendorScheduleCommon';
import { useVendorScheduleModel, VendorScheduleModel } from 'client/portal/vendor/schedule/VendorScheduleModel';
import VendorScheduleUnscheduled from 'client/portal/vendor/schedule/VendorScheduleUnscheduled';
import dayjs from 'dayjs';
import * as React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  AddressInput,
  JobStage,
  JobStatus,
  OrderStatus,
  VendorOrderReviewDocument,
  VendorOrderScheduleDocument,
  VendorScheduledQueryDocument,
} from 'shared/generated';
import { useQueryHook, useQueryPromise } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import EditIcon from 'shared/icons/EditIcon';
import RequestIcon from 'shared/icons/RequestIcon';
import ReviewIcon from 'shared/icons/ReviewIcon';
import ScheduleIcon from 'shared/icons/ScheduleIcon';
import { ValidationAttach } from 'shared/utilities/Validation';

export function VendorOrderCreateScheduleEvent({ appointment }: { appointment: VendorScheduleAppointment }) {
  return (
    <div className="bg-content shadow round p-3 text-sm font-medium text-sm font-medium">
      {appointment.jobs[0].performable.shortName}
    </div>
  );
}

function ScheduleButton({ state, model }: { model: VendorScheduleModel; state: State<OrderCreateState> }) {
  const scoped = useState(state);

  const diffs = model.useDiff();

  return (
    <NavigationButton
      link="../review"
      style={ButtonStyle.PRIMARY}
      onClick={() => {
        scoped.set((scope) => {
          scope.scheduled = true;

          for (const diff of diffs) {
            for (const job of diff.after.jobs) {
              const service = scope.services.find((s) => s.id === job.id);

              service.group = diff.after.group;
              service.locked = diff.after.locked;
              service.providerId = diff.after.providerId;
              service.scheduled = new Date(diff.after.scheduled).toISOString();
            }
          }

          return scope;
        });
      }}
    >
      Continue
    </NavigationButton>
  );
}

export default function VendorOrderCreateSchedule({
  state,
  address,
  update,
}: {
  state: State<OrderCreateState>;
  address: State<AddressInput>;
  update: (data?: Partial<OrderCreateState>) => Promise<void>;
}) {
  const scoped = useState(state);
  const calendar = useState(null as boolean);

  const { order } = useQueryHook(VendorOrderReviewDocument, { orderId: scoped.orderId.get() }, 'cache-and-network');

  const query = useQueryHook(
    VendorOrderScheduleDocument,
    {
      buyerId: scoped.buyer.id.get(),
      vendorId: scoped.vendorId.get(),
    },
    'cache-and-network'
  );

  const start = dayjs().startOf('day').toDate();
  const end = dayjs().endOf('day').toDate();

  const initial = useQueryHook(
    VendorScheduledQueryDocument,
    { vendorId: scoped.vendorId.get(), start: start.toISOString(), end: end.toISOString() },
    'cache-and-network'
  );
  const schedule = useQueryPromise(VendorScheduledQueryDocument);

  const model = useVendorScheduleModel({
    initial: initial.vendor.jobsScheduled,
    start,
    end,
    editable: false,
    requestTimesError: initial.vendor.requestTimesError,
    fetch: async (start, end, reset) => {
      const query = await schedule({
        vendorId: scoped.vendorId.get(),
        start: start.toISOString(),
        end: end.toISOString(),
      });

      return { jobs: query.vendor.jobsScheduled, version: reset ? query.vendor.calendarVersion : undefined };
    },
  });

  const navigate = useNavigate();

  const events = scoped.services
    .map((service) => {
      const address = scoped.address.get();

      const performable = query.vendor.services.find((s) => s.id === service.serviceId.get());

      if (!performable.schedulable) {
        return null;
      }

      const diff = model.scheduled(service.id.get());

      return {
        id: service.id.get(),
        onsite: 30,
        duration: 30,
        performable,
        fields: [],
        assigneeId: diff?.providerId || service.providerId.get(),
        locked: diff?.locked || !!service.locked.get(),
        notifyBuyer: diff?.notifyBuyer,
        notifyAssignee: diff?.notifyAssignee,
        order: {
          id: scoped.orderId.get(),
          requested: [],
          invoiceable: false,
          fullyPaid: false,
          status: OrderStatus.Wizard,
          address: {
            ...address,
            latitude: address.latitude || 0, // TODO: remove 0 once we've ETL'd bad data
            longitude: address.longitude || 0,
            addressFirst: address.line1 + (address.line2 != null ? ' ' + address.line2 : ''),
            addressSecond: `${address.city}, ${address.state} ${address.postalCode}`,
          },
          metadata: order.metadata,
          buyer: query.buyer,
        },
        start: diff?.scheduled
          ? new Date(diff?.scheduled).toISOString()
          : service.scheduled.get()
          ? new Date(service.scheduled.get()).toISOString()
          : null,
        status: JobStatus.Created,
        stage: JobStage.Created,
        stageName: 'New',
        eventId: diff?.group || service.group.get() || service.id.get(),
      };
    })
    .filter((e) => !!e);

  useEffect(() => {
    // prevent updating state while children are rendering
    model.load(events);
  });

  const tomorrow = dayjs().add(1, 'day');

  const form = useState({
    start: tomorrow.startOf('day').format('YYYY-MM-DDTHH:mm'),
    end: tomorrow.endOf('day').format('YYYY-MM-DDTHH:mm'),
  });

  ValidationAttach(form);

  const onContinue = async () => {
    await update();

    state.scheduled.set(true);

    navigate('../review');
  };

  const addrText = `${address.get().line1}, ${address.get().city}, ${address.get().state} ${address.get().postalCode}`;

  const addr = (
    <div className="mb">
      <strong>Address:</strong> {addrText}
    </div>
  );

  if (events.length) {
    if (calendar.get() === true) {
      return (
        <div className="flex w-full h-full flex-col relative">
          <VendorScheduleUnscheduled model={model} element={VendorOrderCreateScheduleEvent} title={addrText} />
          <VendorScheduleCalendar model={model} simple />
          <div className="absolute right-4 bottom-7 z-20">
            <ScheduleButton model={model} state={state} />
          </div>
        </div>
      );
    }

    if (calendar.get() === false) {
      return (
        <Center padding small>
          {addr}
          <Table card>
            <TableHead>
              <TableRow>
                <TableHeadCell>Requested Times</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <SlidebarOpenLink
                    style={LinkStyle.BOLD}
                    icon={<AddIcon />}
                    text="Add Date/Time"
                    onClose={(cancel) => {
                      if (cancel) {
                        return;
                      }

                      scoped.requested.merge([
                        {
                          start: form.start.get() ? dayjs(form.start.get()).toISOString() : undefined,
                          end: form.end.get() ? dayjs(form.end.get()).toISOString() : undefined,
                        },
                      ]);
                    }}
                  >
                    <SlidebarHeader title="Add Date/Time" />
                    <SlidebarContent>
                      <FormGroup>
                        <FormHorizontal state={form.start} name="From">
                          <FormText state={form.start} type="datetime-local" />
                        </FormHorizontal>

                        <FormHorizontal state={form.end} name="To">
                          <FormText state={form.end} type="datetime-local" />
                        </FormHorizontal>
                      </FormGroup>
                      <SlidebarCloseButton>Finish</SlidebarCloseButton>
                    </SlidebarContent>
                  </SlidebarOpenLink>
                </TableCell>
              </TableRow>
              {scoped.requested.map((requested) => (
                <TableRow key={`${requested.start.get()}${requested.end.get()}`}>
                  <TableCell>
                    <SlidebarOpenLink
                      icon={<EditIcon />}
                      text={<Requested start={new Date(requested.start.get())} end={new Date(requested.end.get())} />}
                      onClick={() => {
                        form.set({
                          start: requested.start.get()
                            ? dayjs(requested.start.get()).format('YYYY-MM-DDTHH:mm')
                            : undefined,
                          end: requested.end.get() ? dayjs(requested.end.get()).format('YYYY-MM-DDTHH:mm') : undefined,
                        });
                      }}
                      onClose={() => {
                        requested.set({
                          start: form.start.get() ? dayjs(form.start.get()).toISOString() : undefined,
                          end: form.end.get() ? dayjs(form.end.get()).toISOString() : undefined,
                        });
                      }}
                    >
                      <SlidebarHeader title="Update Date/Time" />
                      <SlidebarContent>
                        <FormGroup>
                          <FormHorizontal state={form.start} name="From">
                            <FormText state={form.start} type="datetime-local" />
                          </FormHorizontal>

                          <FormHorizontal state={form.end} name="To">
                            <FormText state={form.end} type="datetime-local" />
                          </FormHorizontal>
                        </FormGroup>
                        <SlidebarCloseButton>Finish</SlidebarCloseButton>
                      </SlidebarContent>
                    </SlidebarOpenLink>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PromiseButton onClick={onContinue} snackbar={false}>
            Continue
          </PromiseButton>
        </Center>
      );
    }

    return (
      <Center padding small>
        {addr}
        <SelectGrid
          items={[
            {
              icon: <RequestIcon />,
              title: 'Request Times',
              description: 'Mark all services as unscheduled but keep track of customer preferred dates and times.',
              onClick: () => calendar.set(false),
            },
            {
              icon: <ScheduleIcon />,
              title: 'Inline Schedule',
              description: ' Add services directly to the schedule with the option of leaving them unlocked.',
              onClick: () => calendar.set(true),
            },
            {
              icon: <ReviewIcon />,
              title: 'Skip to Review',
              description: 'Mark all services as unscheduled and take care of them later through the schedule page.',
              onClick: onContinue,
            },
          ]}
        />
      </Center>
    );
  }

  return (
    <Center padding>
      {addr}
      <Card>None of the services added to the order require scheduling.</Card>

      <PromiseButton onClick={onContinue} snackbar={false}>
        Continue
      </PromiseButton>
    </Center>
  );
}
