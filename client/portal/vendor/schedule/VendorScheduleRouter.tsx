import { useState } from '@hookstate/core';
import Modal from 'client/global/components/tailwind/Modal';
import Slidebar, { SlidebarContent, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import { updateQuery } from 'client/global/NavigationUtil';
import VendorScheduleCalendar from 'client/portal/vendor/schedule/VendorScheduleCalendar';
import { VendorScheduleAppointment } from 'client/portal/vendor/schedule/VendorScheduleCommon';
import VendorScheduleEventDetail from 'client/portal/vendor/schedule/VendorScheduleEventDetail';
import VendorScheduleHover from 'client/portal/vendor/schedule/VendorScheduleHover';
import { useVendorScheduleModel, VendorScheduleModel } from 'client/portal/vendor/schedule/VendorScheduleModel';
import VendorScheduleReview from 'client/portal/vendor/schedule/VendorScheduleReview';
import VendorScheduleUnscheduled from 'client/portal/vendor/schedule/VendorScheduleUnscheduled';
import dayjs from 'dayjs';
import { parse } from 'query-string';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import PopupView from 'shared/components/tailwind/Popup';
import {
  JobStage,
  VendorScheduledQueryDocument,
  VendorScheduleFieldsDocument,
  VendorScheduleUnscheduledDocument,
  VendorScheduleVersionDocument,
} from 'shared/generated';
import { SessionSetting, SessionSettings } from 'shared/GlobalState';
import { useQueryHook, useQueryPromise } from 'shared/Graph';

function Unscheduled({ appointment }: { appointment: VendorScheduleAppointment }) {
  const open = useState(false);

  const content = (
    <div className="bg-content p-2 rounded-sm text-sm relative">
      <div className="w-36"></div>

      <div onClick={() => open.set(true)}>
        <div>{appointment.order.address.line1}</div>

        <div className="font-light text-gray-600 whitespace-nowrap overflow-hidden">
          {appointment.order.buyer.member.company}
        </div>

        <div className="text-xs whitespace-nowrap overflow-hidden">
          {appointment.jobs.map((j) => j.performable.shortName).join(' + ')}
        </div>
      </div>

      <Slidebar show={open.get()} onClose={() => open.set(false)}>
        <SlidebarHeader title="Job Details" />
        <SlidebarContent>
          <VendorScheduleEventDetail event={appointment} />
        </SlidebarContent>
      </Slidebar>
    </div>
  );

  return (
    <PopupView activator={content} hover>
      <div className="p-2 bg-black bg-opacity-80 mt-2 space-y-1 round text-white text-sm pointer-events-none max-w-xs">
        <VendorScheduleHover
          data={{
            stage: JobStage.Confirmed,
            stageName: 'Unscheduled',
            address: (
              <>
                {appointment.order.address.addressFirst}
                <br />
                {appointment.order.address.addressSecond}
              </>
            ),
            requested: appointment.order.requested,
            metadata: appointment.order.metadata,
          }}
        />
      </div>
    </PopupView>
  );
}

function VendorSchedulePreCache() {
  const { vendorId } = useParams();

  // pre-cache, prevent re-render when hovering event
  // TODO: a way to prevent query from VendorScheduleHover to cause vendor object cache to invalidate
  useQueryHook(VendorScheduleFieldsDocument, { vendorId }, 'cache-first');

  return <></>;
}

function Outdated({ model, vendorId }: { vendorId: string; model: VendorScheduleModel }) {
  const version = useQueryPromise(VendorScheduleVersionDocument, 'no-cache');

  const updateVersion = () => {
    if (conflicts.outdated) {
      return;
    }

    version({ vendorId }).then(({ vendor }) => {
      conflicts.newVersion(vendor.calendarVersion);
    });
  };

  useEffect(() => {
    // every 10 seconds see if calendar is out of date
    const interval = setInterval(updateVersion, 10000);

    return () => {
      clearInterval(interval);
    };
  });

  const conflicts = model.useConflicts();

  const showOutdated = useState(true);

  const outdatedRef = useRef<boolean>(conflicts.outdated);

  useEffect(() => {
    if (outdatedRef.current !== conflicts.outdated && conflicts.outdated && !showOutdated.value) {
      showOutdated.set(true);
    }
    outdatedRef.current = conflicts.outdated;
  });

  return (
    <Modal show={conflicts.outdated && showOutdated.value} onClose={() => showOutdated.set(false)} all>
      <div className="flex items-center bg-content round overflow-hidden shadow p space-x-2">
        <div className="flex-1">The scheduled was changed by someone else, please refresh the page.</div>
        <div className="flex-none flex justify-center items-center">
          <Button onClick={() => showOutdated.set(false)} style={ButtonStyle.CONTENT}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function VendorScheduleRouter() {
  const { vendorId } = useParams();

  const schedule = useQueryPromise(VendorScheduledQueryDocument, 'network-only');
  const unscheduledRefresh = useQueryPromise(VendorScheduleUnscheduledDocument, 'network-only');

  let date: string | Date;
  const params = parse(window.location.search);
  const saved = SessionSettings.getItem(SessionSetting.CALENDAR_LAST_DATE);
  if (typeof params.date === 'string') {
    date = params.date;
  } else if (saved) {
    date = saved;
  } else {
    date = new Date();
  }

  const start = dayjs(date).startOf('day').toDate();
  const end = dayjs(start).add(1, 'day').toDate();

  const initial = useQueryHook(
    VendorScheduledQueryDocument,
    { vendorId, start: start.toISOString(), end: end.toISOString() },
    'cache-first'
  );
  const unscheduled = useQueryHook(VendorScheduleUnscheduledDocument, { vendorId }, 'cache-and-network');

  const fetched = useState(false);

  const model = useVendorScheduleModel({
    initial: [...unscheduled.vendor.jobsUnscheduled, ...initial.vendor.jobsScheduled],
    start,
    version: initial.vendor.calendarVersion,
    end,
    requestTimesError: initial.vendor.requestTimesError,
    fetch: async (start, end, reset) => {
      if (!fetched.get()) {
        // since we get the initial schedule on page render, ignore the first call
        fetched.set(true);

        return;
      }

      const query = await schedule({ vendorId, start: start.toISOString(), end: end.toISOString() });

      let jobs = query.vendor.jobsScheduled;

      if (reset) {
        const refresh = await unscheduledRefresh({ vendorId });

        jobs = [...jobs, ...refresh.vendor.jobsUnscheduled];
      }

      return { jobs, version: reset ? query.vendor.calendarVersion : undefined };
    },
  });

  useEffect(() => {
    // update model to include any new unscheduled jobs
    model.load(unscheduled.vendor.jobsUnscheduled);
  });

  useEffect(() => {
    // change URL on first load
    if (!parse(window.location.search).date) {
      const saved = SessionSettings.getItem(SessionSetting.CALENDAR_LAST_DATE) || Date.now();
      updateQuery({
        date: dayjs(saved).format('YYYY-MM-DD'),
      });
    }
  }, []);

  return (
    <div className="flex w-full flex-col relative">
      <VendorSchedulePreCache />
      <Outdated model={model} vendorId={vendorId} />
      <VendorScheduleReview model={model} />
      <React.Suspense fallback={<></>}>
        <VendorScheduleUnscheduled model={model} element={Unscheduled} />
      </React.Suspense>
      <div className="flex flex-col flex-1">
        <VendorScheduleCalendar model={model} />
      </div>
    </div>
  );
}
