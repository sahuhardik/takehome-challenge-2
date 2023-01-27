import CalendarRenderState from 'client/global/components/calendar/CalendarRenderState';
import Spinner from 'client/global/components/tailwind/Spinner';
import { VendorCalendarProvider, VendorScheduleAppointment } from 'client/portal/vendor/schedule/VendorScheduleCommon';
import { ModelTravelInput, VendorScheduleModel } from 'client/portal/vendor/schedule/VendorScheduleModel';
import * as React from 'react';
import ChevronRight from 'shared/icons/ChevronRight';

export default function VendorScheduleEventTravel({
  render,
  model,
}: {
  model: VendorScheduleModel;
  render: CalendarRenderState<VendorScheduleAppointment, VendorCalendarProvider>;
}) {
  let prevInput: ModelTravelInput;

  const previous = render.previous();

  if (previous) {
    prevInput = {
      from: {
        latitude: previous.source.order.address.latitude,
        longitude: previous.source.order.address.longitude,
      },
      to: {
        latitude: render.source.order.address.latitude,
        longitude: render.source.order.address.longitude,
      },
      start: previous.end.toISOString(),
      end: null,
    };
  } else if (render.resource) {
    prevInput = {
      from: {
        latitude: render.resource.source.address.latitude,
        longitude: render.resource.source.address.longitude,
      },
      to: {
        latitude: render.source.order.address.latitude,
        longitude: render.source.order.address.longitude,
      },
      end: render.start.toISOString(),
    };
  }

  let nextInput: ModelTravelInput;

  if (render.end) {
    const next = render.next();

    // new events dragged on calendar have no end date
    if (next) {
      nextInput = {
        from: {
          latitude: render.source.order.address.latitude,
          longitude: render.source.order.address.longitude,
        },
        to: {
          latitude: next.source.order.address.latitude,
          longitude: next.source.order.address.longitude,
        },
        start: render.end.toISOString(),
        end: null,
      };
    } else if (render.resource) {
      nextInput = {
        from: {
          latitude: render.source.order.address.latitude,
          longitude: render.source.order.address.longitude,
        },
        to: {
          latitude: render.resource.source.address.latitude,
          longitude: render.resource.source.address.longitude,
        },
        start: render.end.toISOString(),
        end: null,
      };
    }
  }

  const result = model.useTravelTime(prevInput, nextInput);

  let previousContent =
    result === null ? (
      <></>
    ) : (
      <div className="w-4 h-4">
        {' '}
        <Spinner />
      </div>
    );

  let nextContent = previousContent;

  if (result) {
    previousContent = previous ? (
      <></>
    ) : (
      <>
        <div className="w-4 h-4">
          <ChevronRight />
        </div>
        :{Math.floor(result.previous.seconds / 60)}
      </>
    );

    nextContent = (
      <>
        :{Math.floor(result.next.seconds / 60)}
        <div className="w-4 h-4">
          <ChevronRight />
        </div>
      </>
    );
  }

  return (
    <>
      {!previous && (
        <div className={`flex items-center h-full absolute transform -translate-x-full top-0 left-0 pr-2`}>
          {previousContent}
        </div>
      )}

      <div
        className={`flex items-center absolute right-0 transform ${
          render.drag ? 'translate-x-full h-full top-0 pl-2' : 'translate-y-full bottom-0'
        }`}
      >
        {nextContent}
      </div>
    </>
  );
}
