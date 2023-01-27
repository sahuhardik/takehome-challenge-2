import { JobAssignButton } from 'client/portal/vendor/components/JobAssignButton';
import * as React from 'react';
import ConfirmationButton from 'shared/components/button/ConfirmationButton';
import PromiseButton from 'shared/components/button/PromiseButton';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  VendorDashboardTodoStatusDocument,
  VendorJobDeleteDocument,
  VendorTodoActionsFragment,
} from 'shared/generated';
import { useMutationPromise } from 'shared/Graph';
import { useUser } from 'shared/UserState';

export default function VendorTodoActions({
  vendorId,
  job,
  onAction,
}: {
  vendorId: string;
  job: VendorTodoActionsFragment;
  onAction?: () => Promise<void> | void;
}) {
  const user = useUser();

  const deleteJob = useMutationPromise(VendorJobDeleteDocument);
  const status = useMutationPromise(VendorDashboardTodoStatusDocument);

  return (
    <div className="flex flex-row space-x-2">
      {!job.userId && <JobAssignButton vendorId={vendorId} jobId={job.id} label="Assign" onAssign={onAction} />}

      {job.userId === user.id && job.nextStatus && (
        <PromiseButton
          style={ButtonStyle.PRIMARY}
          onClick={async () => {
            await status({ jobId: job.id, status: job.nextStatus });

            onAction && (await onAction());
          }}
        >
          {job.nextStatusLabel}
        </PromiseButton>
      )}

      {job.removable && (
        <ConfirmationButton
          key="delete"
          style={ButtonStyle.WARNING}
          title="Delete Todo"
          description="This action cannot be undone."
          confirmText="Delete"
          onClick={async () => {
            await deleteJob({ jobId: job.id });

            onAction && (await onAction());
          }}
        >
          Delete
        </ConfirmationButton>
      )}
    </div>
  );
}
