import { useState } from '@hookstate/core';
import DeliverablePreview from 'client/global/components/model/DeliverablePreview';
import Card from 'client/global/components/tailwind/Card';
import { DescriptionListItem } from 'client/global/components/tailwind/DescriptionList';
import AddressLayout from 'client/global/layout/AddressLayout';
import OrderLayout from 'client/global/layout/OrderLayout';
import ProviderJobSubmit from 'client/portal/provider/job/ProviderJobSubmit';
import { VendorJobDetailsProperty } from 'client/portal/vendor/components/VendorJobDetails';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import JobConfigureForm, { useJobConfigureState } from 'shared/components/fields/JobConfigureForm';
import OrderRuleContext from 'shared/components/fields/OrderRuleContext';
import { PerformableFormType } from 'shared/components/fields/PerformableConfigureForm';
import { FormGroup } from 'shared/components/form/FormLayout';
import Button from 'shared/components/tailwind/Button';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import {
  JobStatus,
  JobView,
  ProviderJobDetailGetDocument,
  ProviderJobInputsDocument,
  ProviderJobStatusDocument,
  ProviderJobSubmitDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import ProviderJobClaimMessage from 'shared/portal/provider/ProviderJobClaimMessage';
import { Validation } from 'shared/utilities/Validation';
import Lightbox from '../../../global/components/tailwind/Lightbox';

function Inputs({ jobId }: { jobId: string }) {
  const {
    job: { inputs, attachments },
  } = useQueryHook(ProviderJobInputsDocument, { jobId });

  return (
    <div className="space-y mt">
      {inputs.map((deliverable) => (
        <Card key={deliverable.id}>
          <div className="flex items-center space-x">
            <DeliverablePreview deliverable={deliverable} />
            {(deliverable.__typename === 'DeliverableImage' || deliverable.__typename === 'DeliverableVideo') && (
              <div className="flex-1">
                <strong>File:</strong> {deliverable.name || deliverable.s3.split('/').pop()}
              </div>
            )}
          </div>
        </Card>
      ))}
      {attachments.map((attachment) => (
        <Card key={attachment.name}>
          <div className="flex items-center space-x">
            <Lightbox src={attachment.url} sizes={[150, '25vw']} key={attachment.url} />
            <div className="flex-1">
              <strong>File:</strong> {attachment.name}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function ProviderJobPage() {
  const { jobId, providerMemberId } = useParams();

  const { orderJob: job } = useQueryHook(ProviderJobDetailGetDocument, { jobId });

  const state = useJobConfigureState(PerformableFormType.SUBMIT, jobId);

  const submit = useMutationPromise(ProviderJobSubmitDocument);
  const {
    job: { inputs },
  } = useQueryHook(ProviderJobInputsDocument, { jobId });
  const status = useMutationPromise(ProviderJobStatusDocument);

  // prevent validation checks from re-rendering entire component
  const Submit = () => (
    <PromiseButton
      disabled={!Validation(useState(state)).valid(true)}
      onClick={async () => {
        await submit({ jobId: job.id, changes: state.get() });
      }}
    >
      Submit
    </PromiseButton>
  );

  let content;

  if (job.view === JobView.SubmitInput) {
    content = <ProviderJobSubmit job={job} />;
  } else if (job.view === JobView.SubmitNoinput) {
    const context = OrderRuleContext(job.order);

    content = (
      <>
        <FormGroup>
          <JobConfigureForm
            type={PerformableFormType.SUBMIT}
            context={context}
            performableId={job.performable.id}
            state={state}
          />
        </FormGroup>
        <Submit />
      </>
    );
  } else if (job.view === JobView.Status || job.view === JobView.Claim) {
    let download = <></>;

    if (inputs.length || job.attachments.length) {
      download = (
        <Button
          onClick={() => {
            window.open(`/api/provider/${providerMemberId}/job/${jobId}/download`);
          }}
        >
          Download Files
        </Button>
      );
    }

    let message =
      job.view === JobView.Claim ? (
        <ProviderJobClaimMessage job={{ id: job.id, user: job.user, status: job.status, view: job.view }} />
      ) : (
        <Message
          type={job.status === JobStatus.Completed ? MessageType.SUCCESS : MessageType.INFO}
          title={job.statusLabel}
          round
          className="mb shadow"
          actions={
            job.nextStatus
              ? [
                  {
                    label: job.nextStatusLabel,
                    onClick: async () => {
                      if (download && job.nextStatus === JobStatus.Finished) {
                        if (
                          !confirm(
                            'You are about to mark the job as finished, are you sure you have download all the files already?'
                          )
                        ) {
                          return false;
                        }
                      }

                      await status({ jobId, status: job.nextStatus });
                    },
                  },
                ]
              : []
          }
        >
          {job.statusDescription}
        </Message>
      );

    let subcontent = (
      <>
        <Inputs jobId={jobId} />
      </>
    );

    if ((job.attachments.length || inputs.length) && job.status === JobStatus.Ready) {
      download = <></>;
      subcontent = <Inputs jobId={jobId} />;
      message = (
        <Message
          type={MessageType.WARNING}
          actions={[
            {
              label: job.nextStatusLabel,
              onClick: async () => {
                await status({ jobId, status: job.nextStatus });
              },
            },
          ]}
        >
          You must begin work before you can download the assets.
        </Message>
      );
    }

    let properties;

    if (job.fields.length > 0) {
      properties = (
        <Card title={job.performable.internalName || job.performable.name}>
          {job.fields.map((field) => (
            <DescriptionListItem name={field.title} key={field.fieldId}>
              <VendorJobDetailsProperty display={field.display} />
            </DescriptionListItem>
          ))}
        </Card>
      );
    }

    let root;

    if (job.root.id !== job.id && job.root.fields.length > 0) {
      root = (
        <Card title={job.root.performable.internalName || job.root.performable.name}>
          {job.root.fields.map((field) => (
            <DescriptionListItem name={field.title} key={field.fieldId}>
              <VendorJobDetailsProperty display={field.display} />
            </DescriptionListItem>
          ))}
        </Card>
      );
    }

    content = (
      <>
        {message}
        {properties}
        {download}
        {root}
        {subcontent}
      </>
    );
  }

  return (
    <AddressLayout address={job.order.address}>
      <OrderLayout orderId={job.order.id}>
        <div className="bg-white round shadow p">{content}</div>
      </OrderLayout>
    </AddressLayout>
  );
}
