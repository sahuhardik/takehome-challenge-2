import { useState } from '@hookstate/core';
import CalendarEvent from 'client/global/components/calendar/CalendarEvent';
import CalendarModel from 'client/global/components/calendar/CalendarModel';
import dayjs from 'dayjs';
import {
  ProviderAppintmentDetailDocument,
  ProviderScheduleDocument,
  ProviderWebAppointmentFragment,
} from 'shared/generated';
import { useQueryPromise } from 'shared/Graph';

export default class ProviderScheduleModel implements CalendarModel<ProviderWebAppointmentFragment, never> {
  end: Date = dayjs().endOf('week').toDate();
  start: Date = dayjs().startOf('week').toDate();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  private listQuery = useQueryPromise(ProviderScheduleDocument);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  private refreshQuery = useQueryPromise(ProviderAppintmentDetailDocument);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  private appointments = useState<ProviderWebAppointmentFragment[]>([]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  private conflicts = useState<{ version: number | null; outdated: boolean }>({
    version: null,
    outdated: false,
  });

  constructor(private memberId: string) {}

  useConflicts() {
    return {
      version: this.conflicts.version.value,
      outdated: this.conflicts.outdated.value,
      init(v: number) {
        this.conflicts.merge({
          version: v,
          outdated: false,
        });
      },
      newVersion(v: number) {
        this.conflicts.merge((prev) => ({
          version: v,
          outdated: prev.outdated || (prev.version !== null && prev.version !== v),
        }));
      },
    };
  }

  useAdd() {
    return () => {
      // providers aren't adding new events
    };
  }

  removeEvent(eventId: string) {
    this.appointments.set((events) => events.filter((e) => e.eventId !== eventId));
  }

  canAssign() {
    // providers cannot reassign
    return 'You cannot reassign the event';
  }

  useEvents() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useState(this.appointments).get().map(this.sourceToEvent);
  }

  canMerge() {
    // providers should not be merging
    return 'You cannot overlap appointments.';
  }

  async refreshEvent(eventId: string) {
    const { appointment } = await this.refreshQuery({ eventId });

    this.appointments.set((appointments) => appointments.map((a) => (a.eventId === eventId ? appointment : a)));
  }

  fetch(start: Date, end: Date) {
    this.listQuery({ start: start.toISOString(), end: end.toISOString(), memberId: this.memberId }).then((resp) => {
      const appointments = [...resp.appointments, ...resp.providerMember.unclaimedAppointments];

      for (const appointment of appointments) {
        if (this.appointments.some((e) => e.eventId.get() === appointment.eventId)) {
          continue;
        }

        this.appointments.merge([appointment]);
      }
    });
  }

  useMerge() {
    return () => {
      // ignore, providers should not be doing this
    };
  }

  useMove() {
    return () => {
      return false;
    };
  }

  private sourceToEvent(event: ProviderWebAppointmentFragment): CalendarEvent<ProviderWebAppointmentFragment> {
    return {
      id: event.eventId,
      editable: false,
      start: new Date(event.start),
      parentId: event.orderId,
      // TODO: make this server call
      duration: dayjs(event.start).diff(event.end, 'minute'),
      source: event,
    };
  }
}
