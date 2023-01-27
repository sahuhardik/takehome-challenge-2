import { useRegisterBreadcrumb } from 'client/global/components/BreadcrumbBar';
import NavigationButton from 'client/global/components/button/NavigationButton';
import { VendorOrderCreateScheduleEvent } from 'client/portal/vendor/order/create/VendorOrderCreateSchedule';
import VendorScheduleCalendar from 'client/portal/vendor/schedule/VendorScheduleCalendar';
import { useVendorScheduleModel, VendorScheduleModel } from 'client/portal/vendor/schedule/VendorScheduleModel';
import VendorScheduleUnscheduled from 'client/portal/vendor/schedule/VendorScheduleUnscheduled';
import dayjs from 'dayjs';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  VendorOrderScheduleJobDocument,
  VendorOrderScheduleVersionDocument,
  VendorScheduledQueryDocument,
  VendorScheduleUpdateDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';

function Button({ model, version }: { model: VendorScheduleModel; version: number }) {
  const { vendorId } = useParams();

  const save = useMutationPromise(VendorScheduleUpdateDocument);

  const diffs = model.useDiff();

  return (
    <div className="absolute right-4 bottom-7 z-20">
      <NavigationButton
        link="../"
        style={ButtonStyle.PRIMARY}
        onClick={async () => {
          const updates = diffs.map((diff) => ({
            group: diff.after.group,
            locked: diff.after.locked,
            jobId: diff.after.jobs[0].id,
            providerId: diff.after.providerId,
            start: new Date(diff.after.scheduled).toISOString(),
            notifyProvider: true,
            notifyBuyer: true,
          }));

          if (updates.length) {
            await save({
              vendorId,
              updates,
              version,
            });
          }
        }}
      >
        Continue
      </NavigationButton>
    </div>
  );
}
export default function VendorOrderSchedule() {
  const { orderId, jobId, vendorId } = useParams();

  const { orderJob } = useQueryHook(VendorOrderScheduleJobDocument, { jobId });

  useRegisterBreadcrumb(`Order #${orderId}`);

  const schedule = useQueryPromise(VendorScheduledQueryDocument);

  const { vendor } = useQueryHook(VendorOrderScheduleVersionDocument, { vendorId }, 'network-only');

  const model = useVendorScheduleModel({
    initial: [orderJob],
    start: dayjs().startOf('day').toDate(),
    end: dayjs().endOf('day').toDate(),
    editable: false,
    requestTimesError: vendor.requestTimesError,
    version: vendor.calendarVersion,
    fetch: async (start, end, reset) => {
      const query = await schedule({ vendorId, start: start.toISOString(), end: end.toISOString() });

      return { jobs: query.vendor.jobsScheduled, version: reset ? query.vendor.calendarVersion : undefined };
    },
  });

  return (
    <div className="flex w-full h-full flex-col relative">
      <VendorScheduleUnscheduled model={model} element={VendorOrderCreateScheduleEvent} />
      <VendorScheduleCalendar model={model} simple />
      <Button model={model} version={vendor.calendarVersion} />
    </div>
  );
}
