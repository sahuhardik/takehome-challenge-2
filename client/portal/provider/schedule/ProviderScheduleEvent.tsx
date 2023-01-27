import { useState } from '@hookstate/core';
import CalendarRenderState from 'client/global/components/calendar/CalendarRenderState';
import Slidebar from 'client/global/layout/slidebar/Slidebar';
import ProviderScheduleEventDetail from 'client/portal/provider/schedule/ProviderScheduleEventDetail';
import ProviderScheduleModel from 'client/portal/provider/schedule/ProviderScheduleModel';
import * as React from 'react';
import { AppointmentStatus, ProviderWebAppointmentFragment } from 'shared/generated';

export default function ProviderScheduleEvent({
  render,
  model,
}: {
  model: ProviderScheduleModel;
  render: CalendarRenderState<ProviderWebAppointmentFragment, never>;
}) {
  const scopedOpen = useState(render.open);

  return (
    <div
      className={`shadow p-2 round text-white cursor-pointer bg-${
        render.source.status === AppointmentStatus.Unclaimed ? 'red' : 'blue'
      }-500`}
    >
      <div className="font-medium whitespace-nowrap overflow-hidden flex items-center space-x-1">
        <span>{render.source.order.address.line1}</span>
      </div>

      <div className="font-light opacity-80 whitespace-nowrap overflow-hidden">
        {render.source.order.buyer.member.company}
      </div>

      <div className="text-xs whitespace-nowrap overflow-hidden">
        {render.source.jobs.map((j) => j.performable.shortName).join(' + ')}
      </div>

      <Slidebar show={scopedOpen.get()} onClose={() => scopedOpen.set(false)}>
        <ProviderScheduleEventDetail eventId={render.source.eventId} model={model} />
      </Slidebar>
    </div>
  );
}
