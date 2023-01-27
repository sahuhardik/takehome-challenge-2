import { useState } from '@hookstate/core';
import { ButtonGroup } from 'client/global/components/button/ButtonGroup';
import SlidebarOpenButton, { SlidebarCloseButton } from 'client/global/components/button/SlidebarOpenButton';
import Badge, { BadgeType } from 'client/global/components/tailwind/Badge';
import Card from 'client/global/components/tailwind/Card';
import { DescriptionListItem } from 'client/global/components/tailwind/DescriptionList';
import { SlidebarContent, SlidebarFooter, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import * as React from 'react';
import { ReactNode } from 'react';
import PromiseButton from 'shared/components/button/PromiseButton';
import DeliverableFieldsForm, { useDeliverableFormState } from 'shared/components/fields/DeliverableFieldsForm';
import { FormGroup } from 'shared/components/form/FormLayout';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  Deliverable,
  DeliverableCardDocument,
  DeliverableStatus,
  FieldRole,
  FieldValue,
  VendorDeliverableApproveDocument,
  VendorDeliverableRejectDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';

type DeliverableProp = Pick<Deliverable, 'rejected' | 'id' | 'status' | 'micrositeStatus'> & {
  fields: Pick<FieldValue, 'title' | 'display'>[];
};

export interface DeliverableCardProps {
  inReview: boolean;
  vendorId: string;
  deliverable: DeliverableProp;
  refreshJobDetail: () => Promise<void>;
  children: ReactNode;
}

function DeliverableRejectSidebar({ vendorId, deliverableId }: { vendorId: string; deliverableId: string }) {
  const reject = useMutationPromise(VendorDeliverableRejectDocument);

  const { values, fields } = useDeliverableFormState(vendorId, deliverableId);

  const state = useState(values);

  return (
    <>
      <SlidebarHeader title="Rejection" />
      <SlidebarContent>
        <FormGroup>
          <DeliverableFieldsForm state={state} fields={fields} />
        </FormGroup>
      </SlidebarContent>
      <SlidebarFooter>
        <SlidebarCloseButton
          onClick={async () => {
            await reject({ deliverableId, fieldValues: state.get() });
          }}
        >
          Reject
        </SlidebarCloseButton>
      </SlidebarFooter>
    </>
  );
}

function DeliverableReject({ deliverable, vendorId }: { deliverable: DeliverableProp; vendorId: string }) {
  const reject = useMutationPromise(VendorDeliverableRejectDocument);
  const query = useQueryHook(DeliverableCardDocument, { vendorId });

  const hasDeliverableFields = query.vendor.fields.filter((f) => f.role === FieldRole.Deliverable).length > 0;

  if (hasDeliverableFields) {
    return (
      <SlidebarOpenButton button="Reject" disabled={deliverable.rejected}>
        <DeliverableRejectSidebar deliverableId={deliverable.id} vendorId={vendorId} />
      </SlidebarOpenButton>
    );
  }

  return (
    <>
      <PromiseButton
        disabled={deliverable.rejected}
        onClick={async () => {
          await reject({ deliverableId: deliverable.id, fieldValues: [] });
        }}
      >
        Reject
      </PromiseButton>
    </>
  );
}

export function DeliverableCard({ vendorId, deliverable, refreshJobDetail, children, inReview }: DeliverableCardProps) {
  const deliverableApprove = useMutationPromise(VendorDeliverableApproveDocument);

  const approveDeliverable = async (deliverableId: string) => {
    await deliverableApprove({ deliverableId });
    await refreshJobDetail();
  };

  return (
    <Card>
      <div className="flex flex-row">
        <div>{children}</div>
        <div className="flex-1">
          <div className="text-right">
            <div className="inline-flex space-x-1 text-xs items-center">
              <p className="text-bold">Microsite Status:</p>
              <Badge type={BadgeType.PRIMARY}>
                {deliverable.micrositeStatus ? String(deliverable.micrositeStatus).toLowerCase() : 'not synced'}
              </Badge>
            </div>
          </div>
          {deliverable.fields.map((field) => (
            <DescriptionListItem name={field.title} key={field.title}>
              {field.display}
            </DescriptionListItem>
          ))}
          {inReview && (
            <ButtonGroup>
              <PromiseButton
                disabled={!deliverable.rejected && deliverable.status === DeliverableStatus.Approved}
                onClick={() => approveDeliverable(deliverable.id)}
                style={ButtonStyle.PRIMARY}
              >
                Approve
              </PromiseButton>
              <DeliverableReject deliverable={deliverable} vendorId={vendorId} />
            </ButtonGroup>
          )}
        </div>
      </div>
    </Card>
  );
}
