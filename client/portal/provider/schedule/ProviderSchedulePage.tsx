import ProviderScheduleEvent from 'client/portal/provider/schedule/ProviderScheduleEvent';
import ProviderScheduleModel from 'client/portal/provider/schedule/ProviderScheduleModel';
import * as React from 'react';
import { lazy } from 'react';
import { useParams } from 'react-router-dom';

const Calendar = lazy(() => import(/* webpackChunkName: "calendar" */ 'client/global/components/calendar/Calendar'));

export default function ProviderSchedulePage() {
  const { providerMemberId } = useParams();
  const model = new ProviderScheduleModel(providerMemberId);

  const eventRender = (render) => <ProviderScheduleEvent model={model} render={render} />;

  return (
    <div className="flex flex-col w-full h-full">
      <Calendar model={model} eventRender={eventRender} />
    </div>
  );
}
