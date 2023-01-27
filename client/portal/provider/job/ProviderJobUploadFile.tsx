import { State, useState } from '@hookstate/core';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';
import DeliverablePreview from 'client/global/components/model/DeliverablePreview';
import Stepper, { StepperStep, StepperStyle } from 'client/global/components/stepper/Stepper';
import Badge, { BadgeType } from 'client/global/components/tailwind/Badge';
import Card from 'client/global/components/tailwind/Card';
import { DescriptionListItem } from 'client/global/components/tailwind/DescriptionList';
import Link from 'client/global/components/tailwind/Link';
import * as React from 'react';
import { lazy } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmationButton from 'shared/components/button/ConfirmationButton';
import PromiseButton from 'shared/components/button/PromiseButton';
import JobConfigureForm, { useJobConfigureState } from 'shared/components/fields/JobConfigureForm';
import OrderRuleContext from 'shared/components/fields/OrderRuleContext';
import { PerformableFormType } from 'shared/components/fields/PerformableConfigureForm';
import { FormGroup } from 'shared/components/form/FormLayout';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import {
  DeliverableType,
  JobStatus,
  ProviderCountsDocument,
  ProviderDeleteDeliverableDocument,
  ProviderDeliverPdfDocument,
  ProviderDeliverVideoDocument,
  ProviderJobDeliverablesGetDocument,
  ProviderJobDetailGetDocument,
  ProviderJobDetailGetQuery,
  ProviderJobSubmitDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import DeleteIcon from 'shared/icons/DeleteIcon';
import MediaIcon from 'shared/icons/MediaIcon';
import VideoIcon from 'shared/icons/VideoIcon';

const FileUpload = lazy(() => import(/* webpackChunkName: "uppy" */ 'client/global/components/FileUpload'));

interface UploadState {
  uploaded: boolean;
}

function Uploaded({ jobId, deliverableType }: { jobId: string; deliverableType: DeliverableType }) {
  const {
    job: { deliverables },
  } = useQueryHook(ProviderJobDeliverablesGetDocument, { jobId });

  const deleteDeliverable = useMutationPromise(ProviderDeleteDeliverableDocument);

  const deleteUploaded = async (deliverableId: string) => {
    await deleteDeliverable({ deliverableId });
  };

  const removeAllDeliverables = async () => {
    await Promise.all(deliverables.map((deliverable) => deleteUploaded(deliverable.id)));
  };

  return (
    <div className="space-y mt">
      {deliverables.map((deliverable) => (
        <Card key={deliverable.id}>
          <div className="absolute right-0 top-0 m-1">
            {deliverable.rejected && <Badge type={BadgeType.NEGATIVE}>Rejected</Badge>}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x">
              <DeliverablePreview deliverable={deliverable} />
              <div>
                {deliverable.__typename === 'DeliverableVideo' && (
                  <DescriptionListItem name="File">
                    <Link
                      icon={deliverable.mime.match(/video\/.*/) ? <VideoIcon /> : undefined}
                      to={deliverable.preview}
                    >
                      {deliverable.name || deliverable.s3.split('/').pop()}
                    </Link>
                  </DescriptionListItem>
                )}
                {deliverable.fields.map((field) => (
                  <DescriptionListItem name={field.title} key={field.title}>
                    {field.display}
                  </DescriptionListItem>
                ))}
              </div>
            </div>
            <PromiseButton onClick={() => deleteUploaded(deliverable.id)}>Delete</PromiseButton>
          </div>
        </Card>
      ))}
      {deliverables.length ? (
        <ConfirmationButton
          title="Delete all deliverables"
          confirmText="Delete"
          icon={<DeleteIcon />}
          description={`Are you sure you want to delete all ${
            deliverableType === DeliverableType.Pdf ? 'pdfs' : 'videos'
          } ?`}
          onClick={async () => {
            await removeAllDeliverables();
          }}
          style={ButtonStyle.DANGER}
        >
          Remove All {deliverableType === DeliverableType.Pdf ? 'pdfs' : 'videos'}
        </ConfirmationButton>
      ) : null}
    </div>
  );
}

function Continue({
  state,
  jobId,
  onClick,
}: {
  state: State<UploadState>;
  jobId: string;
  onClick: () => Promise<boolean>;
}) {
  const {
    job: { deliverables },
  } = useQueryHook(ProviderJobDeliverablesGetDocument, { jobId });

  const navigate = useNavigate();

  return (
    <PromiseButton
      style={ButtonStyle.PRIMARY}
      disabled={deliverables.length === 0 || deliverables.some((d) => d.rejected)}
      onClick={async () => {
        state.uploaded.set(true);
        if (await onClick()) {
          navigate('../submit');
        }
      }}
      className="mt"
    >
      Continue
    </PromiseButton>
  );
}

export default function (deliverableType: DeliverableType) {
  return function ProviderJobUploadVideo({ job }: { job: ProviderJobDetailGetQuery['orderJob'] }) {
    const { providerMemberId } = useParams();
    const navigate = useNavigate();

    const state = useState<UploadState>({
      uploaded: false,
    });

    const formState = useJobConfigureState(PerformableFormType.SUBMIT, job.id);

    const meta = {
      vendorId: job.order.vendorId,
      jobId: job.id,
    };

    const jobStatusGet = useQueryPromise(ProviderJobDetailGetDocument);
    const context = OrderRuleContext(job.order);
    const submit = useMutationPromise(ProviderJobSubmitDocument);
    const counts = useQueryPromise(ProviderCountsDocument);
    const deliverVideo =
      deliverableType === DeliverableType.Pdf
        ? useMutationPromise(ProviderDeliverPdfDocument) // eslint-disable-line react-hooks/rules-of-hooks
        : useMutationPromise(ProviderDeliverVideoDocument); // eslint-disable-line react-hooks/rules-of-hooks
    const {
      job: { deliverables },
    } = useQueryHook(ProviderJobDeliverablesGetDocument, { jobId: job.id });

    const onUploadDone = async () => {
      const { orderJob: jobStatus } = await jobStatusGet({ jobId: job.id });
      return jobStatus.status !== JobStatus.Submitted;
    };

    const rejected = deliverables.some((d) => d.rejected) && (
      <Message type={MessageType.ERROR}>
        Can not upload more assets until the rejected ones below are reviewed and deleted.
      </Message>
    );

    const stepUpload: StepperStep = {
      key: 'upload',
      name: 'Upload',
      complete: () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useState(state).uploaded.get();
      },
      valid: false,
      element: (
        <div className="flex flex-col w-full">
          <div className="pt w-full">
            {rejected || (
              <>
                <FileUpload
                  meta={meta}
                  multiple
                  types={deliverableType === DeliverableType.Pdf ? ['.pdf'] : ['video/*']}
                  onUpload={async (file) => {
                    await deliverVideo({
                      jobId: job.id,
                      name: file.name,
                      s3: file.s3,
                      mime: file.mime,
                      fields: [],
                    });
                  }}
                />
                <Continue state={state} jobId={job.id} onClick={onUploadDone} />
              </>
            )}
          </div>
        </div>
      ),
    };
    const stepSubmit: StepperStep = {
      key: 'submit',
      name: 'Submit',
      valid: true,
      complete: false,
      element: (
        <div className="pt">
          {deliverables.length === 0 && (
            <Message
              type={MessageType.ERROR}
              className="mb-10"
              actions={[
                {
                  icon: <MediaIcon />,
                  label: 'Back to Upload',
                  onClick: () => {
                    navigate('./upload');
                  },
                },
              ]}
            >
              Can not submit because no {deliverableType === DeliverableType.Pdf ? 'pdfs' : 'videos'} were uploaded
            </Message>
          )}
          <FormGroup plain>
            <JobConfigureForm
              type={PerformableFormType.SUBMIT}
              context={context}
              performableId={job.performable.id}
              state={formState}
            />
          </FormGroup>
          <PromiseButton
            onClick={async () => {
              await submit({ jobId: job.id, changes: formState.get() });

              await counts({ providerMemberId });

              return false;
            }}
          >
            Submit Job
          </PromiseButton>
        </div>
      ),
    };

    return (
      <>
        <Card>
          <Stepper steps={[stepUpload, stepSubmit]} style={StepperStyle.SECONDARY} />
        </Card>
        <Uploaded deliverableType={deliverableType} jobId={job.id} />
      </>
    );
  };
}
