import SlidebarOpenButton from 'client/global/components/button/SlidebarOpenButton';
import { VendorUserSelectSidebar } from 'client/portal/vendor/components/VendorUserSelectSidebar';
import * as React from 'react';
import { ButtonStyle, ButtonViewProps } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { VendorJobAssignDocument } from 'shared/generated';
import { useMutationPromise } from 'shared/Graph';

export interface JobAssignButtonProps
  extends Pick<ButtonViewProps, 'icon' | 'style' | 'right' | 'large' | 'slim' | 'disabled' | 'className'> {
  vendorId: string;
  jobId: string;
  label: string;
  onAssign?: () => Promise<void> | void;
}

export function JobAssignButton({
  vendorId,
  jobId,
  label,
  onAssign,
  style = ButtonStyle.PRIMARY,
  ...props
}: JobAssignButtonProps) {
  const assign = useMutationPromise(VendorJobAssignDocument);
  const onSelectUser = async (userId: string) => {
    await assign({ jobId, userId });
    if (onAssign) {
      await onAssign();
    }
  };
  return (
    <>
      <SlidebarOpenButton button={label} style={style} {...props}>
        <VendorUserSelectSidebar title="Assign to User" onSelect={onSelectUser} vendorId={vendorId} />
      </SlidebarOpenButton>
    </>
  );
}
