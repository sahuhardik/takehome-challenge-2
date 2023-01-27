import { useState } from '@hookstate/core';
import CalendarRenderState from 'client/global/components/calendar/CalendarRenderState';
import { VendorCalendarProvider, VendorScheduleAppointment } from 'client/portal/vendor/schedule/VendorScheduleCommon';
import VendorScheduleEventSidebar from 'client/portal/vendor/schedule/VendorScheduleEventSidebar';
import VendorScheduleEventTravel from 'client/portal/vendor/schedule/VendorScheduleEventTravel';
import VendorScheduleHover from 'client/portal/vendor/schedule/VendorScheduleHover';
import { VendorScheduleModel } from 'client/portal/vendor/schedule/VendorScheduleModel';
import dayjs from 'dayjs';
import * as React from 'react';
import PopupView from 'shared/components/tailwind/Popup';
import { OrderStatus } from 'shared/generated';
import CheckIcon from 'shared/icons/CheckIcon';
import JobStageIcon from 'shared/icons/JobStageIcon';
import PricingIcon from 'shared/icons/PricingIcon';

export default function VendorScheduleEvent({
  render,
  model,
  simple,
}: {
  render: CalendarRenderState<VendorScheduleAppointment, VendorCalendarProvider>;
  model: VendorScheduleModel;
  simple?: boolean;
}) {
  const ineligibleMessage = render.drag ? model.canAssign(render.source, render.resource.source, render) : render.error;
  const isIneligible = typeof ineligibleMessage === 'string';
  const outsideRequested = render.source.order.requested?.some(
    (date) =>
      (date.start && dayjs(date.start).isAfter(render.start)) ||
      (date.end && (dayjs(date.end).isSame(render.start) || dayjs(date.end).isBefore(render.start)))
  );

  let popupContent;
  let className = 'shadow-md bg-content';
  const time = dayjs(render.start).format('h:mm A');

  if (render.consumed) {
    className = 'hidden';
  } else if (isIneligible) {
    popupContent = ineligibleMessage;
    className = 'ring-4 ring-red-700 h-full';
  } else if (
    !render.drag &&
    !render.source.creating &&
    !render.source.locked &&
    dayjs().add(1, 'day').isAfter(render.start)
  ) {
    className = 'ring-2 ring-red-700 shadow-md bg-content';

    popupContent = (
      <>
        <strong className="font-semibold">WARNING</strong>: This appointment is scheduled within the next 24 hours and
        neither the provider or the customer has been notified.
      </>
    );
  } else if (render.drag) {
    if (!render.source.locked && outsideRequested) {
      popupContent = `This is outside the customer's requested time range.`;
      className = 'ring-2 ring-yellow-500 shadow-md bg-yellow-50';
    } else {
      popupContent = time;
    }
  } else if (!render.source.locked) {
    className = 'ring-2 ring-yellow-400 shadow-md bg-content';
  }

  let width = 'w-full max-w-full';

  const hovered = useState(render.hover);

  if (render.source.duration < 60 && hovered.get() && render.view !== 'resource') {
    width = 'w-24';
  }

  const toggle = model.useToggleLock();

  const content = (
    <div className={`p-2 round text-gray-900 ${className} ${width} ${!render.source.editable ? 'cursor-pointer' : ''}`}>
      <div className={isIneligible ? 'invisible pointer-events-none' : ''}>
        <div style={{ background: render.resource.source.color, height: 3 }}></div>

        <div className="font-medium whitespace-nowrap overflow-hidden flex items-center space-x-1">
          {render.source.tentative ? (
            render.source.editable ? (
              <div
                className={`${
                  render.source.locked ? 'bg-green-600 bg-opacity-30' : 'bg-gray-50'
                } border border-gray-300 pointer-events-auto inline-flex items-center justify-center w-4 h-4`}
              >
                <div
                  className="pointer-events-auto"
                  style={{ width: 16, height: 16 }}
                  onClick={(e) => {
                    e.preventDefault(); // don't popup detail view

                    toggle(render.id);
                  }}
                >
                  {render.source.locked && <CheckIcon />}
                </div>
              </div>
            ) : (
              <></>
            )
          ) : render.source.order.status === OrderStatus.BuyerAccepted ? (
            <div className="icon-xs flex-shrink-0 text-red-500">
              <PricingIcon />
            </div>
          ) : render.source.order.status === OrderStatus.Completed ? (
            <div className="icon-xs flex-shrink-0 text-green-500">
              <PricingIcon />
            </div>
          ) : (
            <div className="icon-xs flex-shrink-0">
              <JobStageIcon stage={render.source.stage} />
            </div>
          )}
          <span>{render.source.order.address.line1}</span>
        </div>

        {!simple && (
          <div className="font-light text-gray-600 whitespace-nowrap overflow-hidden">
            {render.source.order.buyer.member.company}
          </div>
        )}

        <div className="text-xs whitespace-nowrap overflow-hidden">
          {render.source.jobs
            .map((j) => j.server?.fields.find((f) => !!f.shortName)?.shortName || j.performable.shortName)
            .join(' + ')}
        </div>

        <VendorScheduleEventTravel model={model} render={render} />
      </div>
    </div>
  );

  const tooltipClass =
    'p-2 bg-black bg-opacity-80 mt-2 space-y-1 round text-white text-sm pointer-events-none max-w-xs';

  return (
    <>
      {render.drag || !!render.error ? (
        // use "time" variable as key so that the popup follows user as it is dragged
        <PopupView activator={content} open rerender={time} key="simple">
          {popupContent && <div className={tooltipClass}>{popupContent}</div>}
        </PopupView>
      ) : (
        <PopupView activator={content} open={hovered} animate key="animated">
          <div className={tooltipClass}>
            {popupContent}

            {!render.source.creating && (
              <VendorScheduleHover
                data={{
                  metadata: render.source.order.metadata,
                  requested: render.source.order.requested,
                  address: (
                    <>
                      <div>{render.source.order.address.addressFirst}</div>
                      <div>{render.source.order.address.addressSecond}</div>
                    </>
                  ),
                  stage: render.source.stage,
                  stageName: render.source.stageName,
                }}
              />
            )}
          </div>
        </PopupView>
      )}
      {!render.source.creating && <VendorScheduleEventSidebar render={render} model={model} />}
    </>
  );
}
