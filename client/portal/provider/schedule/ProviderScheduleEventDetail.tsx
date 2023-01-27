import { useState } from '@hookstate/core';
import MapAppointment from 'client/global/components/map/MapAppointment';
import Card from 'client/global/components/tailwind/Card';
import DescriptionColumns, { DescriptionColumnsItem } from 'client/global/components/tailwind/DescriptionColumns';
import { DescriptionListItem } from 'client/global/components/tailwind/DescriptionList';
import Link from 'client/global/components/tailwind/Link';
import SpinnerLoader, { SpinnerWrapper } from 'client/global/components/tailwind/SpinnerLoader';
import Tabs, { Tab } from 'client/global/components/tailwind/Tabs';
import { SlidebarContent } from 'client/global/layout/slidebar/Slidebar';
import ProviderScheduleModel from 'client/portal/provider/schedule/ProviderScheduleModel';
import dayjs from 'dayjs';
import * as React from 'react';
import { ReactNode, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  AcceptAppointmentDocument,
  AppointmentStatus,
  DeliverableStatus,
  ProgressAppointmentDocument,
  ProviderAppintmentDetailDocument,
  ProviderCountsDocument,
  ProviderWebAppointmentJobFragment,
  RejectAppointmentDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import DangerIcon from 'shared/icons/DangerIcon';
import VideoIcon from 'shared/icons/VideoIcon';

function JobDeliverables({ job }: { job: ProviderWebAppointmentJobFragment }) {
  return (
    <Card key={job.id}>
      <div className="pb-2 text-lg">{job.performable.name}</div>
      <SpinnerLoader>
        <div className="flex flex-col space-y-2">
          {job.deliverables
            .filter((d) => d.status !== DeliverableStatus.Deleted && !d.rejected)
            .map((deliverable): [typeof job.deliverables[0], ReactNode] => {
              if (deliverable.__typename === 'DeliverableLink') {
                return [
                  deliverable,
                  <div key={deliverable.id}>
                    <a href={deliverable.link} target="_blank" rel="noreferrer">
                      {deliverable.link}
                    </a>
                  </div>,
                ];
              }

              if (deliverable.__typename === 'DeliverableImage') {
                return [
                  deliverable,
                  <Link to={deliverable.preview} key={deliverable.id}>
                    <img
                      className="object-cover h-24 w-full rounded"
                      src={deliverable.thumbnail}
                      alt={`Deliverable ${deliverable.id}`}
                    />
                  </Link>,
                ];
              }

              if (deliverable.__typename === 'DeliverableVideo') {
                return [
                  deliverable,
                  <Link
                    key={deliverable.id}
                    icon={deliverable.mime.match(/video\/.*/) ? <VideoIcon /> : undefined}
                    to={deliverable.preview}
                  >
                    {deliverable.name || deliverable.s3.split('/').pop()}
                  </Link>,
                ];
              }

              if (deliverable.__typename === 'DeliverableText') {
                return [deliverable, <div key={deliverable.id}>{deliverable.text}</div>];
              }
            })
            .map((deliverable) => (
              <Card key={deliverable[0].id}>{deliverable[1]}</Card>
            ))}
        </div>
      </SpinnerLoader>
    </Card>
  );
}

export default function ProviderScheduleEventDetail({
  eventId,
  model,
}: {
  model: ProviderScheduleModel;
  eventId: string;
}) {
  const { providerMemberId } = useParams();

  const { appointment } = useQueryHook(ProviderAppintmentDetailDocument, { eventId }, 'cache-and-network');
  const counts = useQueryPromise(ProviderCountsDocument);
  const accept = useMutationPromise(AcceptAppointmentDocument);
  const decline = useMutationPromise(RejectAppointmentDocument);
  const progress = useMutationPromise(ProgressAppointmentDocument);
  const showConfirm = useState(false);

  const jobHasAnyDeliverable = useCallback((job: ProviderWebAppointmentJobFragment) => {
    for (const deliverable of job.deliverables || []) {
      if (deliverable.status !== DeliverableStatus.Deleted && !deliverable.rejected) {
        return true;
      }
    }
  }, []);

  const hasDeliverables = useMemo<boolean>(() => {
    for (const job of appointment.jobs || []) {
      if (jobHasAnyDeliverable(job)) return true;

      for (const childJob of job.children || []) {
        if (jobHasAnyDeliverable(childJob)) return true;
      }
    }
    return false;
  }, [appointment.jobs, jobHasAnyDeliverable]);

  if (!appointment) {
    return <SpinnerWrapper />;
  }

  const tabs: Tab[] = [
    {
      name: 'Jobs',
      key: 'jobs',
      useElement: (
        <div className="space-y">
          {appointment.jobs.map((j) => (
            <Card key={j.id}>
              <div className="pb-2 text-lg">{j.performable.name}</div>
              <SpinnerLoader>
                <div>
                  {j.properties.map((p) => (
                    <DescriptionListItem name={p.property.name} key={p.property.name}>
                      {p.display}
                    </DescriptionListItem>
                  ))}
                </div>
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
        <Card>
          <DescriptionColumns>
            <DescriptionColumnsItem name="Customers">
              <div>{appointment.order.buyer.member.company}</div>
            </DescriptionColumnsItem>
            {appointment.order.metadata.map((m) => (
              <DescriptionColumnsItem name={m.title} key={m.propertyId}>
                {m.display}
              </DescriptionColumnsItem>
            ))}
          </DescriptionColumns>
        </Card>
      ),
    },
    ...(hasDeliverables
      ? [
          {
            name: 'Deliverables',
            key: 'deliverables',
            useElement: (
              <div className="space-y">
                {appointment.jobs.map((j) => (
                  <>
                    {jobHasAnyDeliverable(j) ? <JobDeliverables job={j} key={j.id} /> : null}
                    {(j.children || []).map((childJob) =>
                      jobHasAnyDeliverable(childJob) ? <JobDeliverables job={childJob} key={childJob.id} /> : null
                    )}
                  </>
                ))}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <MapAppointment address={appointment.order.address} date={new Date(appointment.start)} />
      <SlidebarContent>
        {showConfirm.value && (
          <div className="absolute inset-1 bg-black bg-opacity-10 flex justify-center items-center z-50">
            <div className="p">
              <Card>
                <div className="flex flex-col space-y-2">
                  <div className="bg-white">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10 text-red-600 p-2">
                        <DangerIcon />
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                          {appointment.progressLabel}
                        </h3>
                        <div className="mt-2 text-sm text-gray-500">
                          You are changing appointment status more than an hour before the scheduled time.
                        </div>
                        <div className="mt-3 py-3 space-x-2 flex items-center">
                          <PromiseButton
                            onClick={async () => {
                              await progress({ eventId: appointment.eventId });
                              await counts({ providerMemberId });
                              showConfirm.set(false);
                            }}
                          >
                            {appointment.progressLabel}
                          </PromiseButton>
                          <Button
                            style={ButtonStyle.SECONDARY}
                            onClick={() => {
                              showConfirm.set(false);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        <Tabs tabs={tabs} router={false} />
        {appointment.status === AppointmentStatus.Unclaimed && (
          <div className="space-x mt">
            <PromiseButton
              onClick={async () => {
                await accept({ eventId: appointment.eventId });

                await model.refreshEvent(appointment.eventId);

                await counts({ providerMemberId });
              }}
            >
              Accept
            </PromiseButton>
            <PromiseButton
              style={ButtonStyle.DANGER}
              onClick={async () => {
                await decline({ eventId: appointment.eventId });

                model.removeEvent(appointment.eventId);

                await counts({ providerMemberId });
              }}
            >
              Decline
            </PromiseButton>
          </div>
        )}
        {appointment.progressible && (
          <div className="text-center pt">
            <PromiseButton
              onClick={async () => {
                if (
                  appointment.status === AppointmentStatus.Claimed &&
                  dayjs(appointment.start).subtract(1, 'hour').isAfter(dayjs())
                ) {
                  showConfirm.set(true);
                } else {
                  await progress({ eventId: appointment.eventId });
                  await counts({ providerMemberId });
                }
              }}
            >
              {appointment.progressLabel}
            </PromiseButton>
          </div>
        )}
      </SlidebarContent>
    </>
  );
}
