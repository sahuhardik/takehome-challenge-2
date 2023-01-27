import CalendarResource from 'client/global/components/calendar/CalendarResource';
import dayjs from 'dayjs';
import {
  Address,
  JobStage,
  User,
  VendorScheduleModelFragment,
  VendorScheduleProvidersDocument,
  VendorScheduleProvidersQuery,
} from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

export interface VendorCalendarProvider {
  id: string;
  address: Pick<Address, 'longitude' | 'latitude'>;
  name: string;
  color: string;
  performableIds: string[];
  balance: number;
  users: Array<{ user: Pick<User, 'name' | 'dateOfBirth'> }>;
  businessHours: VendorScheduleProvidersQuery['vendor']['providers'][0]['businessHours'];
}

type VendorScheduleAppointmentEvent = Pick<VendorScheduleModelFragment, 'order'> & {
  locked: boolean;
  id: string;
  creating: boolean;
  tentative: boolean;
  editable: boolean;
};

export type VendorScheduleAppointmentJob = Pick<VendorScheduleModelFragment, 'performable' | 'id' | 'onsite'> & {
  server: VendorScheduleModelFragment;
};

export class VendorScheduleAppointment implements VendorScheduleAppointmentEvent {
  order: VendorScheduleAppointmentEvent['order'];
  id: string;
  tentative: boolean;
  creating: boolean;
  locked: boolean;
  editable: boolean;

  constructor(event: VendorScheduleAppointmentEvent, public jobs: VendorScheduleAppointmentJob[]) {
    Object.assign(this, event);
  }

  get stage(): JobStage {
    return this.jobs[0].server.stage;
  }

  get stageName(): string {
    return this.jobs[0].server.stageName;
  }

  get duration() {
    return this.jobs.reduce((prev, current) => prev + current.onsite, 0);
  }
}

export function useProviderResources(vendorId: string, today: Date): CalendarResource<VendorCalendarProvider>[] {
  const query = useQueryHook(
    VendorScheduleProvidersDocument,
    { vendorId, start: today.toISOString(), end: dayjs(today).add(6, 'months').toISOString() },
    'no-cache'
  );

  return query.vendor.providers
    .filter((p) => p.performables.length > 0)
    .map((p) => {
      const source = {
        ...p,
        id: p.memberId,
        performableIds: p.performables.map((perf) => perf.performableId),
        name: p.member.company,
        color: p.color,
        address: p.member.address,
        balance: parseFloat(p.balance),
        businessHours: p.businessHours || query.vendor.businessHours || null,
      };

      return {
        id: source.id,
        source,
        sort: p.sort,
        backgroundColor: source.color,
        name: source.name,
        busy: source.busy.map((b) => ({ ...b, start: new Date(b.start), end: new Date(b.end) })),
        businessHours: source.businessHours,
        users: source.users,
      };
    });
}
