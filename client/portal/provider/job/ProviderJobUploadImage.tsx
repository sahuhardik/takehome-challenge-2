import { State, useState } from '@hookstate/core';
import { Untracked } from '@hookstate/untracked';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';
import DeliverablePreview from 'client/global/components/model/DeliverablePreview';
import Stepper, { StepperStep, StepperStyle } from 'client/global/components/stepper/Stepper';
import Badge, { BadgeType } from 'client/global/components/tailwind/Badge';
import Card from 'client/global/components/tailwind/Card';
import { DescriptionListItem } from 'client/global/components/tailwind/DescriptionList';
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
  JobStatus,
  ProviderCountsDocument,
  ProviderDeleteDeliverableDocument,
  ProviderDeliverImageDocument,
  ProviderJobDeliverablesGetDocument,
  ProviderJobDetailGetDocument,
  ProviderJobDetailGetQuery,
  ProviderJobSubmitDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import DeleteIcon from 'shared/icons/DeleteIcon';
import MediaIcon from 'shared/icons/MediaIcon';
import { ValidationAttach } from 'shared/utilities/Validation';

const FileUpload = lazy(() => import(/* webpackChunkName: "uppy" */ 'client/global/components/FileUpload'));

interface UploadState {
  images: { s3: string; mime: string; name: string; saved: boolean }[];
  uploading: boolean;
  remaining: number;
  saving: boolean;
  saved: number;
  errors: number;
  uploaded: boolean;
}

function Uploaded({ jobId }: { jobId: string }) {
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
    <>
      <div className="my-2">Total Uploaded: {deliverables.length}</div>
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
                  {deliverable.__typename === 'DeliverableImage' && (
                    <DescriptionListItem name="File">
                      {deliverable.name || deliverable.s3.split('/').pop()}
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
            description="Are you sure you want to delete all images ?"
            onClick={async () => {
              await removeAllDeliverables();
            }}
            style={ButtonStyle.DANGER}
          >
            Remove All Images
          </ConfirmationButton>
        ) : null}
      </div>
    </>
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
  const scopedState = useState(state);
  const {
    job: { deliverables },
  } = useQueryHook(ProviderJobDeliverablesGetDocument, { jobId });

  const navigate = useNavigate();

  return (
    <PromiseButton
      style={ButtonStyle.PRIMARY}
      disabled={
        scopedState.remaining.get() > 0 ||
        (scopedState.images.length === 0 && deliverables.length === 0) ||
        deliverables.some((d) => d.rejected)
      }
      onClick={async () => {
        if (await onClick()) {
          scopedState.uploaded.set(true);

          navigate('../submit');
        }
      }}
      className="mt"
    >
      Continue
    </PromiseButton>
  );
}

function Saver({ state }: { state: State<UploadState> }) {
  const scoped = useState(state);

  return (
    <div>
      <div>
        Saved {scoped.saved.get()}/{scoped.images.get().length} images to job.
      </div>
      {scoped.errors.get() > 0 && <div>Error occurred, retrying attempt: attempts = {scoped.errors.get()}</div>}
    </div>
  );
}

export default function ProviderJobUploadImage({ job }: { job: ProviderJobDetailGetQuery['orderJob'] }) {
  const { providerMemberId } = useParams();
  const navigate = useNavigate();

  const state = useState<UploadState>({
    images: [],
    uploading: false,
    uploaded: false,
    saving: false,
    saved: 0,
    errors: 0,
    remaining: 0,
  });

  state.attach(Untracked);

  const formState = useJobConfigureState(PerformableFormType.SUBMIT, job.id);

  ValidationAttach(state, (validator) => {
    validator.images.required();
  });

  const meta = {
    vendorId: job.order.vendorId,
    jobId: job.id,
  };

  const jobStatusGet = useQueryPromise(ProviderJobDetailGetDocument);
  const context = OrderRuleContext(job.order);
  const submit = useMutationPromise(ProviderJobSubmitDocument);
  const counts = useQueryPromise(ProviderCountsDocument);
  const deliverImage = useMutationPromise(ProviderDeliverImageDocument);
  const {
    job: { deliverables },
  } = useQueryHook(ProviderJobDeliverablesGetDocument, { jobId: job.id });

  const onUploadDone = async () => {
    state.merge({ saving: true, errors: 0 });

    const images = Untracked(state.images).get();

    for (const image of images) {
      if (image.saved) {
        continue;
      }

      await new Promise<void>((resolve) => {
        let saving = false;
        let interval;

        const saveImage = () => {
          if (saving) {
            return;
          }

          saving = true;

          return deliverImage({
            jobId: job.id,
            name: image.name,
            s3: image.s3,
            mime: image.mime,
            fields: [],
          })
            .then(() => {
              if (interval) {
                clearInterval(interval);
              }

              Untracked(state.images).set((ss) =>
                ss.map((s) =>
                  s.name === image.name
                    ? {
                        ...image,
                        saved: true,
                      }
                    : image
                )
              );

              resolve();

              return true;
            })
            .catch(() => {
              saving = false;

              state.errors.set((e) => e + 1);

              return false;
            });
        };

        saveImage().then((saved) => {
          if (!saved) {
            interval = setInterval(saveImage, 5000);
          }
        });
      });

      state.merge({
        errors: 0,
        saved: Untracked(state.saved).get() + 1,
      });
    }

    const { orderJob: jobStatus } = await jobStatusGet({ jobId: job.id });
    return jobStatus.status !== JobStatus.Submitted;
  };

  const rejected = deliverables.some((d) => d.rejected) && (
    <Message type={MessageType.ERROR}>
      Can not upload more assets until the rejected ones below are reviewed and deleted.
    </Message>
  );

  const steps: StepperStep[] = [
    {
      key: 'upload',
      name: 'Upload',
      complete: () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useState(state).uploaded.get();
      },
      valid: true,
      element: (
        <div className="pt w-full">
          {rejected || (
            <>
              {state.saving.get() ? (
                <Saver state={state} />
              ) : (
                <FileUpload
                  meta={meta}
                  multiple
                  types={['image/*', '.nef', '.cr2', '.dng', '.raw', '.arw']}
                  onStart={state.remaining.set}
                  onUpload={(file) => {
                    state.merge((old) => ({
                      images: [...old.images, { ...file, saved: false }],
                      uploading: true,
                      remaining: old.remaining - 1,
                    }));
                  }}
                />
              )}

              <Continue state={state} jobId={job.id} onClick={onUploadDone} />
            </>
          )}
        </div>
      ),
    },
    {
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
              Can not submit because no images were uploaded
            </Message>
          )}
          {deliverables.some((d) => d.rejected) && (
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
              Can not submit because some images are deleted or rejected
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
            disabled={deliverables.length === 0 || deliverables.some((d) => d.rejected)}
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
    },
  ];

  return (
    <>
      <Card>
        <Stepper steps={steps} style={StepperStyle.SECONDARY} />
      </Card>
      <Uploaded jobId={job.id} />
    </>
  );
}
