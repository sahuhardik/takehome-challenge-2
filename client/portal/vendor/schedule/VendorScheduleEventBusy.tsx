import { useState } from '@hookstate/core';
import { CalendarEventBusyRenderState } from 'client/global/components/calendar/CalendarRenderState';
import { VendorCalendarProvider } from 'client/portal/vendor/schedule/VendorScheduleCommon';
import * as React from 'react';
import Popup from 'shared/components/tailwind/Popup';

export default function VendorScheduleEventBusy({
  render,
  showTitle,
}: {
  render: CalendarEventBusyRenderState<VendorCalendarProvider>;
  showTitle: boolean;
}) {
  const hovered = useState(render.hover);

  const tooltipClass =
    'p-2 bg-black bg-opacity-80 mt-2 space-y-1 round text-white text-sm pointer-events-none max-w-xs';
  const className = `p-3 ${showTitle ? 'cursor-pointer' : ''} h-full w-full max-w-full`;

  const popupContent = (
    <>
      Title <div className="text-gray-300">{render.source.title}</div>
      {render.source.address && (
        <>
          Address
          <div className="text-gray-300">
            {render.source.address.line1}, {render.source.address.city}
          </div>
        </>
      )}
    </>
  );

  return (
    <Popup
      activator={<div className={className} style={{ backgroundColor: 'red' }}></div>}
      className="h-full"
      open={showTitle && hovered}
      key="animated"
    >
      <div className={tooltipClass}>{popupContent}</div>
    </Popup>
  );
}
