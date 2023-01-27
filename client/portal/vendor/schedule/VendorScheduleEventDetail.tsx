import { ButtonGroup } from 'client/global/components/button/ButtonGroup';
import NavigationButton from 'client/global/components/button/NavigationButton';
import MapAppointment from 'client/global/components/map/MapAppointment';
import Card from 'client/global/components/tailwind/Card';
import SpinnerLoader from 'client/global/components/tailwind/SpinnerLoader';
import Tabs, { Tab } from 'client/global/components/tailwind/Tabs';
import { SlidebarContent } from 'client/global/layout/slidebar/Slidebar';
import { VendorJobDetails } from 'client/portal/vendor/components/VendorJobDetails';
import VendorOrderDetails from 'client/portal/vendor/components/VendorOrderDetails';
import {
  VendorScheduleAppointment,
  VendorScheduleAppointmentJob,
} from 'client/portal/vendor/schedule/VendorScheduleCommon';
import * as React from 'react';
import { useParams } from 'react-router-dom';

interface VendorCalendarEventDetailProps {
  event: VendorScheduleAppointment;
  start?: Date;
  onRemoveJob?: (job: VendorScheduleAppointmentJob) => void;
}

export default function VendorScheduleEventDetail({ start, event, onRemoveJob }: VendorCalendarEventDetailProps) {
  const { vendorId } = useParams();

  const tabs: Tab[] = [
    {
      name: 'Jobs',
      key: 'jobs',
      useElement: (
        <div className="space-y">
          {event.jobs.map((j) => (
            <Card key={j.id} onRemove={() => onRemoveJob(j)}>
              <div className="pb-2 text-lg">{j.performable.internalName}</div>
              <SpinnerLoader>
                <VendorJobDetails jobId={j.id} />
              </SpinnerLoader>
            </Card>
          ))}
        </div>
      ),
    },
    {
      name: 'Order',
      key: 'order',
      useElement: (
        <div className="bg-content shadow round">
          <VendorOrderDetails orderId={event.order.id} />
        </div>
      ),
    },
  ];

  return (
    <>
      <MapAppointment address={event.order.address} date={start} />
      <SlidebarContent>
        <Tabs tabs={tabs} router={false} />
        <div className="text-center pt">
          <ButtonGroup>
            <NavigationButton link={`/ui/vendor/${vendorId}/order/view/${event.order.id}`}>Open Order</NavigationButton>
          </ButtonGroup>
        </div>
      </SlidebarContent>
    </>
  );
}
