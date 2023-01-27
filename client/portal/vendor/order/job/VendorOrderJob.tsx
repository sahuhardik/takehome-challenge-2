import { State, useState } from '@hookstate/core';
import { useRegisterBreadcrumb } from 'client/global/components/BreadcrumbBar';
import ActivityLog from 'client/global/components/model/ActivityLog';
import Card from 'client/global/components/tailwind/Card';
import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import Tabs, { Tab } from 'client/global/components/tailwind/Tabs';
import { VendorAttachments } from 'client/portal/vendor/components/VendorAttachments';
import { VendorJobDetails } from 'client/portal/vendor/components/VendorJobDetails';
import { VendorOrderJobChanges } from 'client/portal/vendor/order/job/VendorOrderJobChanges';
import * as React from 'react';
import { useCallback } from 'react';
import 'react-image-gallery/styles/css/image-gallery.css';
import { useParams } from 'react-router-dom';
import ConfirmationButton from 'shared/components/button/ConfirmationButton';
import PromiseButton from 'shared/components/button/PromiseButton';
import JobConfigureForm from 'shared/components/fields/JobConfigureForm';
import OrderRuleContext from 'shared/components/fields/OrderRuleContext';
import { PerformableFormType } from 'shared/components/fields/PerformableConfigureForm';
import { useServiceConfigureForm } from 'shared/components/fields/ServiceConfigureForm';
import { FormGroup } from 'shared/components/form/FormLayout';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import {
  DeliverableStatus,
  JobStage,
  VendorDeleteDeliverableDocument,
  VendorJobActivityDocument,
  VendorJobAttachmentsDocument,
  VendorJobDetailDocument,
  VendorJobDetailQuery,
  VendorJobSaveAttachmentDocument,
  VendorJobStatusDocument,
  VendorJobUpdateDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import DeleteIcon from 'shared/icons/DeleteIcon';
import ReviewIcon from 'shared/icons/ReviewIcon';
import VendorAddDeliverables from './VendorAddDeliverables';
import VendorPreviewDeliverables from './VendorPreviewDeliverables';

function Service({ job, edit }: { job: VendorJobDetailQuery['orderJob']; edit: State<boolean> }) {
  const scoped = useState(edit);

  const context = OrderRuleContext(job.order);

  const state = useServiceConfigureForm(job.performable.id, PerformableFormType.VENDOR, job.fields);

  const save = useMutationPromise(VendorJobUpdateDocument);

  const isManuallyModified = job.lines.some((line) => !!line.manual);

  if (scoped.get()) {
    return (
      <>
        <FormGroup plain>
          <JobConfigureForm
            type={PerformableFormType.VENDOR}
            context={context}
            performableId={job.performable.id}
            state={state}
            isManuallyModified={isManuallyModified}
          />
        </FormGroup>
        <PromiseButton
          className="mt"
          disabled={state}
          onClick={async () => {
            await save({ jobId: job.id, data: { fields: state.get() }, versionId: job.versionId });
            scoped.set(false);
          }}
        >
          Save
        </PromiseButton>
      </>
    );
  }

  return <VendorJobDetails jobId={job.id} />;
}

export default function VendorOrderJob({ jobId }: { jobId?: string }) {
  const params = useParams();

  const { orderJob: job } = useQueryHook(VendorJobDetailDocument, { jobId: jobId || params.jobId });
  const jobDetail = useQueryPromise(VendorJobDetailDocument);

  const saveAttachments = useMutationPromise(VendorJobSaveAttachmentDocument);

  const deleteDeliverable = useMutationPromise(VendorDeleteDeliverableDocument);

  const deleteUploaded = async (deliverableId: string) => {
    await deleteDeliverable({ deliverableId });
  };

  const removeAllDeliverables = async () => {
    await Promise.all(job.deliverables.map((deliverable) => deleteUploaded(deliverable.id)));
  };

  useRegisterBreadcrumb(`Job #${job.id}`);

  const edit = useState(false);
  const addDeliverables = useState(false);

  const refreshJobDetail = useCallback(async () => {
    await jobDetail({ jobId: jobId || params.jobId });
  }, [jobDetail, jobId, params.jobId]);

  const tabs: Tab[] = [
    ...(job.performable.__typename === 'Service' || job.performable.properties.length
      ? [
          {
            name: 'Configuration',
            key: 'configuration',
            useActions() {
              const scoped = useState(edit);

              if (!scoped.get()) {
                return [
                  <Button key="edit" onClick={() => edit.set(true)}>
                    Edit
                  </Button>,
                ];
              }

              if (job.stage === JobStage.Completed) {
                return [];
              }

              return [
                <Button key="cancel" onClick={() => edit.set(false)} style={ButtonStyle.SECONDARY}>
                  Cancel
                </Button>,
              ];
            },
            useElement() {
              if (job.performable.__typename === 'Service') {
                return <Service job={job} edit={edit} />;
              }

              return <VendorJobDetails jobId={job.id} />;
            },
          },
        ]
      : []),
    {
      name: 'Activity',
      key: 'activity',
      useElement() {
        const query = useQueryHook(VendorJobActivityDocument, { jobId: job.id }, 'cache-and-network');

        return <ActivityLog activities={query.orderJob.activity} />;
      },
    },
    {
      name: `Deliverables (${job.deliverables.length})`,
      key: 'deliverables',
      useActions() {
        const scoped = useState(addDeliverables);

        if (!scoped.get()) {
          return [
            <Button
              key="download"
              onClick={() => {
                window.open(`/api/provider/foobar/job/${job.id}/deliverables`);
              }}
            >
              Download
            </Button>,
            <Button key="add" onClick={() => addDeliverables.set(true)}>
              Add Deliverables
            </Button>,
            job.deliverables?.length ? (
              <ConfirmationButton
                key="removeall"
                title="Delete all deliverables"
                confirmText="Delete"
                icon={<DeleteIcon />}
                description="Are you sure you want to delete all deliverables ?"
                onClick={async () => {
                  await removeAllDeliverables();
                }}
                style={ButtonStyle.DANGER}
              >
                Remove All
              </ConfirmationButton>
            ) : null,
          ];
        }

        return [
          <Button key="cancel" onClick={() => addDeliverables.set(false)} style={ButtonStyle.SECONDARY}>
            Back
          </Button>,
        ];
      },
      useElement() {
        if (addDeliverables.get()) {
          return <VendorAddDeliverables job={job} moveBack={() => addDeliverables.set(false)} />;
        }

        return (
          <VendorPreviewDeliverables job={job} deleteDeliverable={deleteUploaded} refreshJobDetail={refreshJobDetail} />
        );
      },
    },
    {
      useElement() {
        const fetchAttachments = useQueryPromise(VendorJobAttachmentsDocument);

        return (
          <VendorAttachments
            meta={{ vendorId: job.order.vendorId, jobId: job.id }}
            attachments={job.attachments}
            onUpload={({ mime, name, s3 }) =>
              Promise.all([
                saveAttachments({
                  jobId: job.id,
                  mime,
                  name,
                  s3,
                }),
                fetchAttachments({ jobId: job.id }),
              ])
            }
          />
        );
      },
      key: 'attachments',
      name: 'Attachments',
    },
  ];

  if (job.changes.length > 0) {
    tabs.push({
      name: 'Changes',
      key: 'changes',
      error: true,
      useElement: <VendorOrderJobChanges job={job} />,
    });
  }

  let message;

  const status = useMutationPromise(VendorJobStatusDocument);

  if (job.stage === JobStage.ReviewVendor && !job.rejected && !job.changes?.length) {
    if (job.deliverables.some((d) => d.status === DeliverableStatus.Submitted)) {
      message = (
        <Message type={MessageType.ERROR} title="Review Deliverables" className="mb shadow">
          Before this job can be considered complete, you must review the deliverables first.
        </Message>
      );
    } else {
      message = (
        <Message
          type={MessageType.WARNING}
          title="Job Review"
          className="mb shadow"
          actions={[
            {
              icon: <ReviewIcon />,
              label: 'Mark Reviewed',
              onClick: async () => {
                await status({ jobId: job.id, status: job.nextStatus });
              },
            },
          ]}
        >
          Before this job can be considered complete, you must review the provider&apos;s submission first.
        </Message>
      );
    }
  } else if (job.rejected) {
    message = (
      <Message type={MessageType.ERROR} title="Rejected" className="mb shadow">
        Provider should replace and/or remove rejected deliverables
        <div>
          <Link style={LinkStyle.BOLD} to={'./deliverables'}>
            Go to deliverables
          </Link>
        </div>
      </Message>
    );
  } else if (job.changes?.length > 0) {
    message = (
      <Message type={MessageType.ERROR} title="Pending change request" className="mb shadow">
        Vendor should accept / reject change requests.
        <div>
          <Link style={LinkStyle.BOLD} to={'./changes'}>
            Go to changes
          </Link>
        </div>
      </Message>
    );
  } else if (job.stage === JobStage.Completed) {
    message = <Message className="mb shadow" type={MessageType.SUCCESS} title="Job Complete" />;
  }

  /*
            const actions = [
              <Button key='approve'>Approve</Button>
            ,
              <Button key='submit'>Force Submit</Button>
            ,
              <Button key='cancel'>Cancel</Button>
            ,
            ];
            */

  return (
    <>
      {message}
      <Card innerTitle={job.performable.internalName}>
        <Tabs tabs={tabs} router={!jobId} />
      </Card>
    </>
  );
}
