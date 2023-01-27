import { useState } from '@hookstate/core';
import { OverlayView, Polyline } from '@react-google-maps/api';
import Map from 'client/global/components/map/Map';
import Modal from 'client/global/components/tailwind/Modal';
import { useUpdateQuery } from 'client/global/NavigationUtil';
import OrderFieldsEditSlideBar from 'client/portal/vendor/schedule/OrderFieldsEditSlideBar';
import { useProviderResources, VendorCalendarProvider } from 'client/portal/vendor/schedule/VendorScheduleCommon';
import VendorScheduleEvent from 'client/portal/vendor/schedule/VendorScheduleEvent';
import VendorScheduleEventBusy from 'client/portal/vendor/schedule/VendorScheduleEventBusy';
import { VendorScheduleModel } from 'client/portal/vendor/schedule/VendorScheduleModel';
import VendorScheduleProvider from 'client/portal/vendor/schedule/VendorScheduleProvider';
import dayjs from 'dayjs';
import { parse } from 'query-string';
import * as React from 'react';
import { lazy, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { VendorAccountDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

const Calendar = lazy(() => import(/* webpackChunkName: "calendar" */ 'client/global/components/calendar/Calendar'));

function RouteMap({ model, provider }: { model: VendorScheduleModel; provider: VendorCalendarProvider }) {
  const providerCoordinates = {
    lat: provider.address.latitude,
    lng: provider.address.longitude,
    time: null as Date,
  };

  const route = [...model.useRoute(provider), providerCoordinates];

  const polylines = [];

  for (let i = 0; i < route.length; i += 1) {
    const stop = route[i];

    // if the first stop on route, assume we are leaving from the provider address
    const prev = i === 0 ? providerCoordinates : route[i - 1];

    // if last stop on route, assume we are going to provider address
    const next = i === route.length - 1 ? providerCoordinates : route[i];

    polylines.push(
      <Polyline
        key={`${stop.time || 'start'}-line`}
        path={[next, prev]}
        options={{
          strokeWeight: 6,
          strokeColor: '#000000',
          icons: [
            {
              icon: {
                path: 4,
                fillColor: '#ffffff',
                fillOpacity: 1,
                scale: 3,
              },
              offset: '90%',
              repeat: '30px',
            },
          ],
        }}
      />
    );

    if (stop.time) {
      polylines.push(
        <OverlayView key={`${stop.time}-overlay`} position={stop} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
          <div className="bg-content shadow p-2 round font-medium text-xs">{dayjs(stop.time).format('hh:mm A')}</div>
        </OverlayView>
      );
    }
  }

  return (
    <div className="w-3/4 h-3/4">
      <Map lat={providerCoordinates.lat} lng={providerCoordinates.lng} zoom={10}>
        {polylines}
      </Map>
    </div>
  );
}

export default function VendorScheduleCalendar({ model, simple }: { model: VendorScheduleModel; simple?: boolean }) {
  const { vendorId } = useParams();
  const resources = useProviderResources(vendorId, model.today);
  const {
    vendor: { showCalendarTitles, collapseTimeSlots },
  } = useQueryHook(VendorAccountDocument, { vendorId }, 'cache-first');
  const location = useLocation();
  const updateQuery = useUpdateQuery();
  const parsed = parse(location.search);

  // render route here instead of in VendorScheduleProvider due to calendar re-rendering and destroying modal instances
  const route = useState(null as VendorCalendarProvider);

  const eventRender = (render) => <VendorScheduleEvent render={render} model={model} simple={simple} />;

  const eventBusyRender = (render) => <VendorScheduleEventBusy render={render} showTitle={showCalendarTitles} />;

  const resourceRender = ({ resource, selected }) => (
    <VendorScheduleProvider
      provider={resource}
      selected={selected}
      model={model}
      onRoute={() => {
        route.set(resource);
      }}
      onSelect={() => {
        updateQuery({
          provider: resource.id,
        });
      }}
      onDeselect={() => {
        updateQuery({
          provider: null,
        });
      }}
    />
  );

  const provider = route.get();

  const content = (
    <>
      <Modal show={!!provider} onClose={() => route.set(null)}>
        {useMemo(
          () => (
            <RouteMap model={model} provider={provider} />
          ),
          [model, provider]
        )}
      </Modal>
      <Calendar
        model={model}
        showResource={parsed.provider as string}
        collapseTimeSlots={collapseTimeSlots}
        resources={resources}
        eventRender={eventRender}
        eventBusyRender={eventBusyRender}
        resourceRender={resourceRender}
      />
      <OrderFieldsEditSlideBar model={model} />
    </>
  );

  if (resources.length === 0) {
    return <></>;
  }

  return content;
}
