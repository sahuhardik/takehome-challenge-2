import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmationButton from 'shared/components/button/ConfirmationButton';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { CancelJobPreviewDocument, VendorJobCancelDocument } from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';

export default function CancelJobButton({ jobId }: { jobId: string }) {
  const {
    cancelJobPreview: { unscheduled, refund, notifyProvider, notifyAgent },
  } = useQueryHook(CancelJobPreviewDocument, { jobId });

  const cancel = useMutationPromise(VendorJobCancelDocument);
  const navigate = useNavigate();

  const description = [];

  if (unscheduled) {
    description.push(
      'The job will be removed from the schedule and any third party calendars that have been synced will be updated.'
    );
  }

  if (Number(refund) > 0) {
    description.push(`The buyer(s) will be owed a refund of ${refund}.`);
  }

  if (notifyProvider) {
    description.push('The provider assigned to this job will be notified of the cancelation.');
  }

  if (notifyAgent) {
    description.push('The buyer(s) will be notified of the cancelation.');
  }

  return (
    <ConfirmationButton
      title="Cancel Job"
      style={ButtonStyle.DANGER}
      slim
      description={
        <>
          {description.length > 0 && (
            <ul className="list-disc pl-6">
              {description.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
          <p className="font-bold mt-2">Do you want to proceed with job cancellation?</p>
        </>
      }
      confirmText="Yes"
      onClick={async () => {
        await cancel({ jobId });

        navigate('../');
      }}
      cancelText="No"
    >
      Cancel
    </ConfirmationButton>
  );
}
