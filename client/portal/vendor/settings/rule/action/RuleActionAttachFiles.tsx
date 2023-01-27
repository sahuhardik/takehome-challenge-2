import { State, useState } from '@hookstate/core';
import FileUpload from 'client/global/components/FileUpload';
import FormFile from 'client/global/components/form/FormFile';
import Link from 'client/global/components/tailwind/Link';
import Selectable from 'client/global/components/tailwind/Selectable';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  ActionAttachFilesMetadataWrite,
  ActionType,
  ActionWrite,
  Attachment,
  NotificationType,
  RuleWrite,
} from 'shared/generated';
import EditIcon from 'shared/icons/EditIcon';
import { DetectValidator } from 'shared/utilities/Validation';

export function RuleActionAttachFilesValidation(validator: DetectValidator<RuleWrite>) {
  const { attachFiles } = validator.actions.when((a) => a.type.get() === ActionType.ATTACH_FILES);
  attachFiles.notificationType.required();
  attachFiles.attachments.validate((attachments) => !!attachments.length, 'Select atleast one attachment!!!');
}

function Edit({ state }: { state: State<ActionWrite> }) {
  const scope = useState(state);
  const { vendorId } = useParams();

  const showUploader = useState(scope.attachFiles?.attachments.length === 0);
  const edit = useState(!scope.attachFiles.notificationType?.get());
  const notificationTypes = [
    { value: NotificationType.AppointmentScheduled, label: 'Appointments' },
    { value: NotificationType.OrderReceived, label: 'Order Received' },
    { value: NotificationType.OrderConfirm, label: 'Order Confirm' },
  ];

  React.useEffect(() => {
    if (state.attachFiles?.attachments.length === 0) {
      showUploader.set(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.attachFiles?.attachments.length]);

  if (!edit.get()) {
    const notificationLabel = notificationTypes.find(
      ({ value }) => value === state.attachFiles.notificationType?.get()
    )?.label;
    return (
      <div className="action-preview">
        <Link icon={<EditIcon />} onClick={() => edit.set(true)}>
          Attach files to
          <strong> {notificationLabel} </strong>
          notifications.
        </Link>
      </div>
    );
  }

  return (
    <>
      <FormGroup plain>
        <FormHorizontal state={scope.attachFiles.notificationType} name="Notification Type">
          <FormSelect state={scope.attachFiles.notificationType} options={notificationTypes} />
        </FormHorizontal>
        <FormHorizontal state={scope.attachFiles.attachments} name="Attachments">
          {state.attachFiles.attachments?.map((attachment) => (
            <FormFile key={attachment.url.get()} state={attachment} meta={{ vendorId }} />
          ))}
          {showUploader.get() && (
            <FileUpload
              meta={{ vendorId }}
              multiple
              onUpload={(file) => {
                const fileData: Attachment = {
                  name: file.name,
                  url: file.s3,
                  mime: file.mime,
                };
                scope.attachFiles.attachments.set((existingAttachments) => existingAttachments.concat(fileData));
                showUploader.set(false);
              }}
            />
          )}
          {scope.attachFiles?.attachments.length > 0 && (
            <Button
              style={ButtonStyle.SECONDARY}
              onClick={() => showUploader.set((show) => !show)}
              className="mt-2 mb-2"
            >
              {showUploader.get() ? 'Hide Uploader' : 'Add Files'}
            </Button>
          )}
        </FormHorizontal>
      </FormGroup>
      <Button disabled={scope} onClick={() => edit.set(false)} className="mt-4">
        Finish
      </Button>
    </>
  );
}

export default function RuleActionAttachFiles({ state }: { state: State<ActionWrite> }) {
  if (state.type.get() === ActionType.ATTACH_FILES) {
    return <Edit state={state} />;
  }

  return (
    <Selectable
      title="Attach Files"
      onClick={() => {
        state.merge({
          type: ActionType.ATTACH_FILES,
          attachFiles: {
            attachments: [],
          } as unknown as ActionAttachFilesMetadataWrite,
        });
      }}
    >
      Add attachments in notifications.
      <p className="mt-2">
        <strong className="font-semibold text-theme-secondary">Example Use Case:</strong> A customer places an order for
        a particular service which requires sending educational material as a follow up.
      </p>
    </Selectable>
  );
}
