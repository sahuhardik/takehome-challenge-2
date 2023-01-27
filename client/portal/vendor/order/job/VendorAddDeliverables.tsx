import Badge, { BadgeType } from 'client/global/components/tailwind/Badge';
import React, { lazy } from 'react';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';
import FormTextView from 'shared/components/form/FormText/FormTextView';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  PerformableInputType,
  VendorDeliverImageDocument,
  VendorDeliverPdfDocument,
  VendorDeliverVideoDocument,
  VendorJobDetailQuery,
} from 'shared/generated';
import { useMutationPromise } from 'shared/Graph';
import useJobDeliverLink from 'shared/portal/provider/useJobDeliverLink';
import useJobDeliverMatterport from 'shared/portal/provider/useJobDeliverMatterport';
import useJobDeliverText from 'shared/portal/provider/useJobDeliverText';
import { Validation } from 'shared/utilities/Validation';

const FileUpload = lazy(() => import(/* webpackChunkName: "uppy" */ 'client/global/components/FileUpload'));

enum FileType {
  IMAGE,
  VIDEO,
  PDF,
}

function vendorJobUploadDeliverableItem(uploadType: FileType) {
  return function ({ job }: { job: VendorJobDetailQuery['orderJob'] }) {
    const uploadItem =
      uploadType === FileType.IMAGE
        ? useMutationPromise(VendorDeliverImageDocument)
        : uploadType === FileType.PDF
        ? useMutationPromise(VendorDeliverPdfDocument)
        : useMutationPromise(VendorDeliverVideoDocument);

    const meta = {
      vendorId: job.order.vendorId,
      jobId: job.id,
    };

    const getMediaTypes = (fileType: FileType) => {
      if (fileType === FileType.PDF) {
        return ['.pdf'];
      } else if (fileType === FileType.IMAGE) {
        return ['image/*', '.nef', '.cr2', '.dng', '.raw', '.arw'];
      } else {
        return ['video/*'];
      }
    };

    return (
      <FileUpload
        meta={meta}
        multiple
        types={getMediaTypes(uploadType)}
        onUpload={(file) => {
          uploadItem({
            jobId: job.id,
            name: file.name,
            s3: file.s3,
            mime: file.mime,
            fields: [],
          });
        }}
      />
    );
  };
}

function LinkDeliveryForm({ job, moveBack }: { job: VendorJobDetailQuery['orderJob']; moveBack: () => void }) {
  const { state, save, rejected } = useJobDeliverLink(job.id);

  return (
    <div className="relative pt w-full">
      {rejected && (
        <div className="absolute right-0 top-0 m-1">
          <Badge type={BadgeType.NEGATIVE}>Rejected</Badge>
        </div>
      )}
      <FormGroup plain>
        <FormHorizontal state={state.link} name="URL">
          <FormText state={state.link} placeholder={'https://www.example.com'} />
        </FormHorizontal>
      </FormGroup>
      <Button
        style={ButtonStyle.PRIMARY}
        onClick={async () => {
          await save();
          moveBack?.();
        }}
        disabled={!Validation(state).valid(true)}
        className="mt"
      >
        Save
      </Button>
    </div>
  );
}

function TextDeliveryForm({ job, moveBack }: { job: VendorJobDetailQuery['orderJob']; moveBack: () => void }) {
  const { state, save, rejected } = useJobDeliverText(job.id);

  return (
    <div className="relative pt w-full">
      {rejected && (
        <div className="absolute right-0 top-0 m-1">
          <Badge type={BadgeType.NEGATIVE}>Rejected</Badge>
        </div>
      )}

      <FormGroup plain>
        <FormHorizontal state={state.text} name="Text">
          <FormTextView value={state.text.get()} onChange={(text) => state.text.set(text)} valid lines={5} />
        </FormHorizontal>
      </FormGroup>

      <Button
        style={ButtonStyle.PRIMARY}
        onClick={async () => {
          await save();
          moveBack?.();
        }}
        disabled={!Validation(state).valid(true)}
        className="mt"
      >
        Save
      </Button>
    </div>
  );
}

function MatterportDeliveryForm({ job, moveBack }: { job: VendorJobDetailQuery['orderJob']; moveBack: () => void }) {
  const { state, save, rejected } = useJobDeliverMatterport(job.id);

  return (
    <div className="relative pt w-full">
      {rejected && (
        <div className="absolute right-0 top-0 m-1">
          <Badge type={BadgeType.NEGATIVE}>Rejected</Badge>
        </div>
      )}
      <FormGroup plain>
        <FormHorizontal state={state.brandedUrl} name="Branded URL">
          <FormText state={state.brandedUrl} placeholder={'https://www.example.com'} />
        </FormHorizontal>
        <FormHorizontal state={state.unbrandedUrl} name="Unbranded URL">
          <FormText state={state.unbrandedUrl} placeholder={'https://www.example.com'} />
        </FormHorizontal>
      </FormGroup>
      <Button
        style={ButtonStyle.PRIMARY}
        onClick={async () => {
          await save();
          moveBack?.();
        }}
        disabled={!Validation(state).valid(true)}
        className="mt"
      >
        Save
      </Button>
    </div>
  );
}

const inputComponentsMap = {
  [PerformableInputType.Image]: vendorJobUploadDeliverableItem(FileType.IMAGE),
  [PerformableInputType.Text]: TextDeliveryForm,
  [PerformableInputType.Video]: vendorJobUploadDeliverableItem(FileType.VIDEO),
  [PerformableInputType.Pdf]: vendorJobUploadDeliverableItem(FileType.PDF),
  [PerformableInputType.Link]: LinkDeliveryForm,
  [PerformableInputType.Matterport]: MatterportDeliveryForm,
};

export default function AddDeliverables({
  job,
  moveBack,
}: {
  job: VendorJobDetailQuery['orderJob'];
  moveBack: () => void;
}) {
  const Component = inputComponentsMap[job.performable.inputType];

  if (!Component) {
    return <div>Not Implemented</div>;
  }

  return <Component job={job} moveBack={moveBack} />;
}
