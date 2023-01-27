import { State, useState } from '@hookstate/core';
import { Untracked } from '@hookstate/untracked';
import CalendarEvent from 'client/global/components/calendar/CalendarEvent';
import CalendarModel from 'client/global/components/calendar/CalendarModel';
import { CalendarState, HourRange } from 'client/global/components/calendar/CalendarRenderState';
import { VendorCalendarProvider, VendorScheduleAppointment } from 'client/portal/vendor/schedule/VendorScheduleCommon';
import dayjs from 'dayjs';
import { useEffect, useRef } from 'react';
import { DistanceDocument, VendorScheduleModelFragment } from 'shared/generated';
import { useQueryPromise } from 'shared/Graph';
import { tz } from 'shared/state/TimezoneState';
import uuid, { v4 } from 'uuid';

interface ModelJobState {
  group: string;
  scheduled: number;
  providerId: string;
  locked: boolean;
}

interface ModelAppointmentState {
  group: string;
  notifyAssignee: boolean;
  notifyBuyer: boolean;
}

/**
 * These are the bare-minimum data points required to build a schedule/calendar view. While from the user perspective there are "appointments"
 * (a group of jobs scheduled to be done at a certain time, represented as a CalendarEvent entity), we also managed this via
 * the job.scheduled and job.group attributes. The CalendarEvents are derived from the scheduled/group attributes, so we choose to manage
 * calendar state using the raw job data vs. keeping track of "events" that will be recreated based on schedule changes. For example, if a job
 * is taken off an existing event and moved to a different one, that action is just a matter of changing the "group" value to a different id
 * (but the UI will be responsible for recreating the virtual event). If the server sees a new "group" id that does not have a corresponding
 * CalendarEvent, one will automatically be created. Similarly, if a group is removed from a job (or scheduled is not set), then any orphaned
 * CalendarEvents will be removed.
 */
interface ModelJob {
  server: VendorScheduleModelFragment;
  id: string;
  modified: boolean;
  editable: boolean;
  original: ModelJobState;
  current: ModelJobState;
}

export interface ModelDiffData extends ModelJobState {
  jobs: VendorScheduleModelFragment[];
}

export interface ModelDiff {
  before: ModelDiffData;
  after: ModelDiffData;
  notifyAssignee: boolean;
  notifyBuyer: boolean;
  order: VendorScheduleModelFragment['order'];
}

type OrderDiffCallback = (orderId: string) => void;

export interface ModelTravelInput {
  from: { latitude: number; longitude: number };
  to: { latitude: number; longitude: number };
  start?: string;
  end?: string;
}

export interface ModelTravelCalculation {
  previous: { seconds: number; meters: number };
  next: { seconds: number; meters: number };
}

export interface VendorScheduleModel extends CalendarModel<VendorScheduleAppointment, VendorCalendarProvider> {
  load<F extends VendorScheduleModelFragment>(jobs: F[], replace?: number, editable?: boolean);

  fetch(state: Date, end: Date);

  today: Date;

  useToggleLock(): (group: string) => void;

  useRemoveGroup(): (group: string) => void;

  useRemoveJob(): (group: string) => void;

  useUnscheduled(): CalendarEvent<VendorScheduleAppointment>[];

  useTravelTime(prev: ModelTravelInput, next: ModelTravelInput): ModelTravelCalculation | undefined | null;

  useRoute(provider: VendorCalendarProvider): { lat: number; lng: number; time: Date }[];

  useOrderHasDiff(callback: OrderDiffCallback);

  useDiff(): ModelDiff[];

  useNotify(group: string): State<ModelAppointmentState>;

  // TODO: smell?
  scheduled(jobId: string): ModelJobState & ModelAppointmentState;

  reset(): Promise<void>;
}

export function useVendorScheduleModel({
  initial = [],
  fetch,
  editable = true,
  start,
  end,
  version = null,
  requestTimesError = false,
}: {
  initial?: VendorScheduleModelFragment[];
  start: Date;
  end: Date;
  version?: number;
  editable?: boolean; // TODO: make this a per event thing
  requestTimesError?: boolean;
  fetch?: (
    start: Date,
    end: Date,
    reset: boolean
  ) => Promise<{ jobs: VendorScheduleModelFragment[]; version?: number }>;
}): VendorScheduleModel {
  const loadConvert = (jobs: VendorScheduleModelFragment[], editable = true) => {
    const transformed: ModelJob[] = [];

    const groups = new Set<string>();
    const notifies: ModelAppointmentState[] = [];

    for (const job of jobs) {
      const start = typeof job.start === 'string' ? new Date(job.start).getTime() : null;

      if (!job.eventId) {
        // unscheduled jobs
        job.eventId = v4();
      }

      if (start) {
        groups.add(job.eventId);
      }

      if (!notifies.some((n) => n.group === job.eventId)) {
        notifies.push({
          group: job.eventId,
          notifyAssignee: job.notifyAssignee,
          notifyBuyer: job.notifyBuyer,
        });
      }

      transformed.push({
        server: job,
        id: job.id,
        original: {
          group: job.eventId,
          scheduled: start,
          providerId: job.assigneeId,
          locked: job.locked,
        },
        editable,
        current: {
          group: job.eventId,
          scheduled: start,
          providerId: job.assigneeId,
          locked: job.locked,
        },
        modified: false,
      });
    }

    return { transformed, notifies };
  };

  const initialJobs = loadConvert(initial, editable);

  const state = useState({
    start: start.getTime(),
    end: end.getTime(),
    version,
    outdated: false,
    minStart: start.getTime(),
    maxEnd: end.getTime(),
    today: Date.now(),
    jobs: initialJobs.transformed,
    notifies: initialJobs.notifies,
  });

  state.attach(Untracked);

  const updateJob = (
    scope: typeof state,
    jobId: string | State<ModelJob>,
    data: Partial<ModelJobState> | ((job: State<ModelJob>) => Partial<ModelJobState>)
  ) => {
    const job = typeof jobId === 'string' ? scope.jobs.find((j) => j.id.get() === jobId) : jobId;

    const oldNotify = state.notifies.find((n) => n.group.get() === job.current.group.get());

    job.current.merge(typeof data === 'function' ? data(job) : data);

    const raw = job.get();

    job.modified.set(
      !(
        raw.current.group === raw.original.group &&
        raw.current.locked === raw.original.locked &&
        raw.current.providerId === raw.original.providerId &&
        ((!raw.current.scheduled && !raw.original.scheduled) ||
          dayjs(raw.current.scheduled).isSame(raw.original.scheduled))
      )
    );

    const currentNotify = state.notifies.find((n) => n.group.get() === job.current.group.get());

    if (!currentNotify) {
      state.notifies.merge([
        {
          group: raw.current.group,
          notifyBuyer: oldNotify.notifyBuyer.get(),
          notifyAssignee: oldNotify.notifyAssignee.get(),
        },
      ]);
    }
  };

  const updateScheduleGroup = (scope: typeof state, group: string, scheduled: Date, providerId: string) => {
    const jobs = scope.jobs.filter((j) => j.current.group.get() === group);

    for (const job of jobs) {
      updateJob(scope, job, {
        locked: job.current.providerId.get() === providerId ? job.current.locked.get() : false,
        providerId,
        scheduled: scheduled.getTime(),
      });
    }
  };

  const updateGroupJobs = (
    scope: typeof state,
    group: string,
    update: ((job: ModelJob) => Partial<ModelJobState>) | Partial<ModelJobState>
  ) => {
    const jobs = scope.jobs.filter((j) => j.current.group.get() === group);

    for (const job of jobs) {
      updateJob(scope, job, typeof update === 'function' ? update(job.get()) : update);
    }
  };

  const jobsToAppointment = (jobs: ModelJob[]): VendorScheduleAppointment => {
    return new VendorScheduleAppointment(
      {
        order: jobs[0].server.order,
        id: jobs[0].current.group,
        tentative: !jobs[0].server.locked || jobs[0].original?.providerId !== jobs[0].current.providerId,
        locked: jobs[0].current.locked,
        creating: !jobs[0].server?.id,
        editable: jobs[0].editable,
      },
      jobs.map((j) => ({
        server: j.server,
        performable: j.server.performable,
        status: j.server.status,
        id: j.id,
        onsite: j.server.onsite,
      }))
    );
  };

  const orderDiff = useRef({} as { [orderId: string]: boolean });
  const orderDiffHandlers = new Set<OrderDiffCallback>();
  const handleOrderMove = (orderId: string) => {
    if (!orderDiff.current[orderId]) {
      orderDiff.current[orderId] = true;
      orderDiffHandlers.forEach((callback) => callback(orderId));
    }
  };

  const travelCache = useRef<Record<string, ModelTravelCalculation>>({});

  const clearOrderMove = () => {
    orderDiff.current = {};
  };

  return {
    useConflicts() {
      const scope = useState(state);

      return {
        version: scope.version.value,
        outdated: scope.outdated.value,
        init(v: number) {
          scope.merge({
            version: v,
            outdated: false,
          });
        },
        newVersion(v: number) {
          const currentlyOutdated = scope.outdated.get();

          if (currentlyOutdated) {
            return;
          }

          const outdated = scope.version.get() !== null && scope.version.get() !== v;

          if (!outdated) {
            return;
          }

          scope.merge((prev) => ({
            version: v,
            outdated: prev.outdated || (prev.version !== null && prev.version !== v),
          }));
        },
      };
    },
    get today() {
      // TODO: get rid of this, only here due to render loop
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return new Date(useState(state).today.get());
    },
    get start() {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return new Date(useState(state).start.get());
    },
    get end() {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return new Date(useState(state).end.get());
    },
    useTravelTime(prev, next) {
      const cacheKey = JSON.stringify({
        // memoize calculation so that it only runs once per hour dragged
        prev: {
          ...prev,
          start: prev.start ? dayjs(prev.start).startOf('hour').toISOString() : null,
          end: prev.end ? dayjs(prev.end).startOf('hour').toISOString() : null,
        },
        next: {
          ...next,
          start: next.start ? dayjs(next.start).startOf('hour').toISOString() : null,
          end: next.end ? dayjs(next.end).startOf('hour').toISOString() : null,
        },
      });

      const distance = useQueryPromise(DistanceDocument, 'no-cache');

      const state = useState(travelCache.current[cacheKey]);

      useEffect(() => {
        let mounted = true;
        let interval;

        if (travelCache.current[cacheKey] === undefined) {
          // prevent concurrent requests
          travelCache.current[cacheKey] = null;

          if (dayjs().isAfter(prev.start || prev.end) || dayjs().isAfter(next.start || next.end)) {
            // do not calculate travel on old events
            state.set(null);
          } else {
            if (state.get()) {
              // clear out state so user knows we are refreshing
              state.set(undefined);
            }

            Promise.all([distance({ req: prev }), distance({ req: next })]).then(([prev, next]) => {
              travelCache.current[cacheKey] = {
                previous: {
                  seconds: prev.distance.seconds,
                  meters: prev.distance.meters,
                },
                next: {
                  seconds: next.distance.seconds,
                  meters: next.distance.meters,
                },
              };

              if (mounted) {
                state.set(travelCache.current[cacheKey]);
              }
            });
          }
        } else if (travelCache.current[cacheKey] === null) {
          interval = setInterval(() => {
            if (mounted && travelCache.current[cacheKey]) {
              state.set(travelCache.current[cacheKey]);
            }
          }, 100);
        }

        return () => {
          if (interval) {
            clearInterval(interval);
          }

          mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [distance, state, cacheKey]);

      return state.get();
    },
    scheduled(jobId: string) {
      const job = Untracked(state.jobs)
        .get()
        .find((j) => j.id === jobId);

      if (!job?.current.scheduled) {
        return null;
      }

      const notify = Untracked(state.notifies)
        .get()
        .find((n) => n.group === job.current.group);

      return {
        scheduled: job.current.scheduled,
        providerId: job.current.providerId,
        locked: job.current.locked,
        group: job.current.group,
        notifyBuyer: notify.notifyBuyer,
        notifyAssignee: notify.notifyAssignee,
      };
    },
    useEvents(): CalendarEvent<VendorScheduleAppointment>[] {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const jobs = useState(state).jobs.filter((j) => !!j.current.scheduled.get());

      const grouped = new Map<string, ModelJob[]>();

      for (const job of jobs) {
        const raw = job.get();

        if (!grouped.has(raw.current.group)) {
          grouped.set(raw.current.group, []);
        }

        grouped.get(raw.current.group).push(raw);
      }

      const events = [];

      for (const [group, jobs] of grouped.entries()) {
        const appointment = jobsToAppointment(jobs);

        events.push({
          // all the jobs should have the same provider/scheduled when grouped
          resourceId: jobs[0].current.providerId,
          start: new Date(jobs[0].current.scheduled),
          parentId: jobs[0].server.order.id,
          end: dayjs(jobs[0].current.scheduled).add(appointment.duration, 'minute').toDate(),
          id: group,
          editable: !state.outdated.value && appointment.editable,
          duration: appointment.duration,
          source: appointment,
        });
      }

      return events;
    },
    useUnscheduled(): CalendarEvent<VendorScheduleAppointment>[] {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useState(state)
        .jobs.filter((j) => !j.current.scheduled.get())
        .map((job) => {
          const raw = job.get();

          return {
            id: raw.current.group,
            duration: raw.server.onsite,
            editable: true,
            parentId: raw.server.order.id,
            source: jobsToAppointment([raw]),
          };
        });
    },
    canAssign(source: VendorScheduleAppointment, resource: VendorCalendarProvider, eventRange?: HourRange) {
      const canDoJobs = source.jobs.every((j) => resource.performableIds.includes(j.performable.id));

      if (!canDoJobs) {
        return 'This provider cannot perform every job in the appointment.';
      }

      if (requestTimesError) {
        const outsideRequested = source.order.requested?.some(
          (date) =>
            (date.start && dayjs(date.start).isAfter(eventRange.start)) ||
            (date.end && (dayjs(date.end).isSame(eventRange.start) || dayjs(date.end).isBefore(eventRange.start)))
        );
        if (outsideRequested) {
          return "This is outside the customer's requested time range.";
        }
      }

      const isBlocked = source.order.buyer.blockedProviders.some((b) => b.memberId === resource.id);

      if (isBlocked) {
        return 'This provider was blocked by the customer.';
      }

      const hasExclusive = source.order.buyer.exclusiveProviders.length;

      const isNotExclusive =
        hasExclusive && !source.order.buyer.exclusiveProviders.some((b) => b.memberId === resource.id);

      if (isNotExclusive) {
        return 'This provider is not preferred by the customer.';
      }

      if (eventRange && resource.businessHours?.length) {
        const start = tz(eventRange.start);
        const end = tz(eventRange.end);

        const businessHours = resource.businessHours[start.weekday()];

        if (!businessHours?.hours) {
          return 'This provider does not work during this hour.';
        }

        const allowedRange = {
          from: start.hour(businessHours.hours.from.hour).minute(businessHours.hours.from.minute),
          to: end.hour(businessHours.hours.to.hour).minute(businessHours.hours.to.minute),
        };

        if (start.isBefore(allowedRange.from) || end.isAfter(allowedRange.to)) {
          return 'This provider does not work during this hour.';
        }
      }

      return true;
    },
    fetch(start: Date, end: Date) {
      if (fetch) {
        fetch(start, end, false).then((resp) => {
          state.set((s) => ({
            ...s,
            minStart: start.getTime() < s.minStart ? start.getTime() : s.minStart,
            maxEnd: end.getTime() > s.maxEnd ? end.getTime() : s.maxEnd,
          }));

          if (resp?.jobs) {
            this.load(resp.jobs);
          }
        });
      }
    },
    async reset() {
      const { jobs, version } = await fetch(
        dayjs(state.minStart.get()).startOf('day').toDate(),
        dayjs(state.maxEnd.get()).endOf('day').toDate(),
        true
      );

      this.load(jobs, version);
      clearOrderMove();
    },
    useAdd() {
      const scope = useState(state);

      return (event: CalendarState<VendorScheduleAppointment, VendorCalendarProvider>) => {
        if (this.canAssign(event.source, event.resource.source, event) !== true) {
          return;
        }

        updateScheduleGroup(scope, event.id, event.start, event.resource.id);
      };
    },
    useMove() {
      const scope = useState(state);

      return (event: CalendarState<VendorScheduleAppointment, VendorCalendarProvider>) => {
        if (this.canAssign(event.source, event.resource.source, event) !== true) {
          return false;
        }

        updateScheduleGroup(scope, event.id, event.start, event.resource.id);

        if (event.source?.order?.id && !event.source?.tentative) {
          handleOrderMove(event.source.order.id);
        }

        return true;
      };
    },
    useRemoveGroup() {
      const scope = useState(state);

      return (group: string) => {
        updateGroupJobs(scope, group, {
          group: uuid.v4(), // give each job its own new group
          providerId: null,
          locked: false,
          scheduled: null,
        });
      };
    },
    useRemoveJob() {
      const scope = useState(state);

      return (jobId: string) => {
        updateJob(scope, jobId, (job) => ({
          group: (!job.original.scheduled && job.original.group.get()) || uuid.v4(),
          providerId: null,
          locked: false,
          scheduled: null,
        }));
      };
    },
    useRoute(provider: VendorCalendarProvider) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const jobs = useState(state).jobs.filter(
        (j) =>
          j.current.providerId.get() === provider.id &&
          j.current.scheduled.get() &&
          dayjs(j.current.scheduled.get()).isSame(this.start, 'day')
      );

      const groups = new Set();

      const routes = [];

      for (const job of jobs) {
        const raw = job.get();

        if (groups.has(raw.current.group)) {
          // only show coordinates once in-case they are assigned multiple jobs for the same order
          continue;
        }

        groups.add(raw.current.group);

        routes.push({
          lat: raw.server.order.address.latitude,
          lng: raw.server.order.address.longitude,
          time: new Date(raw.current.scheduled).toISOString(),
        });
      }

      return routes.sort((a, b) => a.time.localeCompare(b.time));
    },
    canMerge(source: VendorScheduleAppointment, destination: VendorScheduleAppointment) {
      if (source.order.id !== destination.order.id) {
        return 'Cannot combine jobs that belong to separate orders.';
      }

      return true;
    },
    useToggleLock() {
      const scope = useState(state);

      return (group: string) => {
        updateGroupJobs(scope, group, (job) => ({
          locked: !job.current.locked,
        }));
      };
    },
    useMerge() {
      const scope = useState(state);

      return (
        source: VendorScheduleAppointment,
        destination: VendorScheduleAppointment,
        resource: VendorCalendarProvider
      ) => {
        if (!this.canMerge(source, destination)) {
          return;
        }

        const destinationJob = scope.jobs.find((j) => j.id.get() === destination.jobs[0].id).get();

        const start = tz(new Date(destinationJob.current.scheduled));
        const end = start.clone().add(source.duration + destination.duration, 'minutes');

        if (this.canAssign(source, resource, { start: start.toDate(), end: end.toDate() }) !== true) {
          return;
        }

        for (const job of source.jobs) {
          updateJob(scope, job.id, {
            group: destination.id,
            providerId: destinationJob.current.providerId,
            locked: destinationJob.current.locked,
            scheduled: destinationJob.current.scheduled,
          });
        }
      };
    },

    useOrderHasDiff(callback): void {
      useEffect(() => {
        if (callback) {
          orderDiffHandlers.add(callback);
          return () => orderDiffHandlers.delete(callback);
        }
      }, [callback]);
    },

    useDiff(): ModelDiff[] {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const rawJobs = useState(state.jobs).get();
      const notifies = useState(state.notifies).get();

      const modified = rawJobs.filter((j) => j.modified);

      const diffs: ModelDiff[] = [];

      const groupToDiff = (group: string, current = true): ModelDiffData => {
        const key = current ? 'current' : 'original';
        const jobs = rawJobs.filter((j) => j[key].group === group);

        return {
          scheduled: jobs[0][key].scheduled,
          group,
          locked: jobs[0][key].locked,
          providerId: jobs[0][key].providerId,
          jobs: jobs.map((j) => j.server),
        };
      };

      for (const job of modified) {
        const isAfter = diffs.some((d) => d.after && d.after.jobs.some((j) => j.id === job.id));
        const isBefore = diffs.some((d) => d.before && d.before.jobs.some((j) => j.id === job.id));

        if (isAfter || isBefore) {
          // ignore this job if it was already included in a diff
          continue;
        }

        const after = groupToDiff(job.current.group, true);
        const currentNotify = notifies.find((n) => n.group === job.current.group);

        if (!job.current.scheduled && job.original.scheduled) {
          const originalNotify = notifies.find((n) => n.group === job.original.group);
          const before = groupToDiff(job.original.group, false);

          // only show the original jobs that haven't been rescheduled
          before.jobs = rawJobs
            .filter((j) => !j.current.scheduled && j.original.group === job.original.group)
            .map((j) => j.server);

          diffs.push({
            before,
            notifyAssignee: originalNotify.notifyAssignee,
            notifyBuyer: originalNotify.notifyBuyer,
            order: job.server.order,
            after: null,
          });
        } else if (job.current.scheduled && !job.original.scheduled) {
          const addedToScheduledGroup = rawJobs.some(
            (j) => j.original.scheduled && j.original.group === job.current.group
          );

          if (addedToScheduledGroup) {
            diffs.push({
              order: job.server.order,
              notifyAssignee: currentNotify.notifyAssignee,
              notifyBuyer: currentNotify.notifyBuyer,
              before: groupToDiff(job.current.group, false),
              after,
            });
          } else {
            diffs.push({
              before: null,
              notifyAssignee: currentNotify.notifyAssignee,
              notifyBuyer: currentNotify.notifyBuyer,
              order: job.server.order,
              after,
            });
          }
        } else if (job.current.group !== job.original.group) {
          // if a multi-job event was broken up, only show diff for relevant jobs
          const before = groupToDiff(job.original.group, false);
          before.jobs = before.jobs.filter((j) => after.jobs.some((aj) => aj.id === j.id));

          diffs.push({
            notifyAssignee: currentNotify.notifyAssignee,
            notifyBuyer: currentNotify.notifyBuyer,
            order: job.server.order,
            before,
            after,
          });
        } else {
          const before = groupToDiff(job.current.group, false);

          // if any other jobs were removed from the order, let's save them for another diff
          before.jobs = before.jobs.filter((b) => after.jobs.some((j) => j.id === b.id));

          diffs.push({
            notifyAssignee: currentNotify.notifyAssignee,
            notifyBuyer: currentNotify.notifyBuyer,
            order: job.server.order,
            before,
            after,
          });
        }
      }

      return diffs;
    },
    useNotify(group: string) {
      return useState(state.notifies.find((n) => n.group.get() === group));
    },
    load(jobs: VendorScheduleModelFragment[], replace?: number) {
      if (replace) {
        const convert = loadConvert(jobs, editable);

        state.merge({
          jobs: convert.transformed,
          notifies: convert.notifies,
          outdated: false,
          version: replace,
        });

        return;
      }

      // do not allow new job data to replace itself if it has already been modified
      const newJobs = jobs.filter((j) => !state.jobs.some((jstate) => jstate.modified && jstate.id.get() === j.id));

      if (!newJobs.length) {
        return;
      }

      const convert = loadConvert(newJobs, editable);

      state.set((old) => {
        const newJobIds = newJobs.map((j) => j.id);
        const newGroups = convert.notifies.map((n) => n.group);

        // removes any unmodified jobs that we are replacing
        const retainedJobs = old.jobs.filter((o) => !newJobIds.includes(o.id));
        const retainedGroups = old.notifies.filter((n) => !newGroups.includes(n.group));

        return {
          ...old,
          notifies: [...retainedGroups, ...convert.notifies],
          jobs: [...retainedJobs, ...convert.transformed],
        };
      });
    },
  };
}
