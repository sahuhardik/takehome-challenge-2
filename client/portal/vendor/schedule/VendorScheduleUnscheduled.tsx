import { useProviderResources, VendorScheduleAppointment } from 'client/portal/vendor/schedule/VendorScheduleCommon';
import { VendorScheduleModel } from 'client/portal/vendor/schedule/VendorScheduleModel';
import * as React from 'react';
import { useParams } from 'react-router-dom';

const CalendarDrag = React.lazy(
  () => import(/* webpackChunkName: "calendar" */ 'client/global/components/calendar/CalendarDrag')
);

export default function VendorScheduleUnscheduled({
  model,
  title = 'Unscheduled',
  element: Element,
}: {
  model: VendorScheduleModel;
  title?: string;
  element: React.FunctionComponent<{ appointment: VendorScheduleAppointment }>;
}) {
  const conflicts = model.useConflicts();
  const { vendorId } = useParams();
  const unscheduled = model.useUnscheduled();

  const resources = useProviderResources(vendorId, model.today);

  return (
    unscheduled.length > 0 && (
      <div className="bg-theme-primary p-2 space-y-2">
        <div className="text-white text-center uppercase text-sm font-semibold">{title}</div>
        <div className="flex flex space-x-2">
          {unscheduled.map((i) => (
            <div key={i.id}>
              {conflicts.outdated ? (
                <Element appointment={i.source} />
              ) : (
                <CalendarDrag event={i} resources={resources} model={model}>
                  <Element appointment={i.source} />
                </CalendarDrag>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  );
}
