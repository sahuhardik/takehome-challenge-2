import Requested from 'client/global/components/Requested';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { JobStage, OrderMetadata, OrderRequested, VendorScheduleFieldsDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import JobStageIcon from 'shared/icons/JobStageIcon';

interface VendorScheduleHoverData {
  stage: JobStage;
  stageName: string;
  requested: Pick<OrderRequested, 'start' | 'end'>[];
  address: React.ReactNode;
  metadata: Pick<OrderMetadata, 'propertyId' | 'display'>[];
}

export default function VendorScheduleHover({ data }: { data: VendorScheduleHoverData }) {
  const { vendorId } = useParams();
  const {
    vendor: { fields },
  } = useQueryHook(VendorScheduleFieldsDocument, { vendorId }, 'cache-first');

  return (
    <>
      <div className="flex items-center space-x-1">
        <div className="font-medium icon-xs">
          <JobStageIcon stage={data.stage} />
        </div>
        <div className="text-gray-300">{data.stageName}</div>
      </div>
      <strong className="font-semibold">{data.address}</strong>
      {data.requested.length > 0 && (
        <div>
          <dt className="font-medium">Requested</dt>
          <dd className="mt-0.5 text-gray-300">
            {data.requested.map((r) => (
              <Requested start={r.start} end={r.end} key={`${r.start}${r.end}`} />
            ))}
          </dd>
        </div>
      )}
      {fields
        .filter((f) => f.showOnScheduleHover)
        .map((field) => (
          <div key={field.id}>
            <dt className="font-medium">{field.name}</dt>
            <dd className="mt-0.5 text-gray-300">
              {data.metadata.find((m) => m.propertyId === field.id)?.display || 'N/A'}
            </dd>
          </div>
        ))}
    </>
  );
}
