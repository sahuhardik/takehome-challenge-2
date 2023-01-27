import { useState } from '@hookstate/core';
import CalendarRenderState from 'client/global/components/calendar/CalendarRenderState';
import Slidebar from 'client/global/layout/slidebar/Slidebar';
import { VendorCalendarProvider, VendorScheduleAppointment } from 'client/portal/vendor/schedule/VendorScheduleCommon';
import VendorScheduleEventDetail from 'client/portal/vendor/schedule/VendorScheduleEventDetail';
import { VendorScheduleModel } from 'client/portal/vendor/schedule/VendorScheduleModel';
import * as React from 'react';

export default function VendorScheduleEventSidebar({
  model,
  render,
}: {
  model: VendorScheduleModel;
  render: CalendarRenderState<VendorScheduleAppointment, VendorCalendarProvider>;
}) {
  const remove = model.useRemoveJob();
  const scopedOpen = useState(render.open);

  return (
    <Slidebar show={scopedOpen.get()} onClose={() => scopedOpen.set(false)}>
      <VendorScheduleEventDetail event={render.source} start={render.start} onRemoveJob={(j) => remove(j.id)} />
    </Slidebar>
  );
}
