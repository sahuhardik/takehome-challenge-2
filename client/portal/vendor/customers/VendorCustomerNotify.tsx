import { useState } from '@hookstate/core';
import { SlidebarCloseButton } from 'client/global/components/button/SlidebarOpenButton';
import { notificationTypeToMacros } from 'client/global/components/form/notificationTypeToMacros';
import { SlidebarContent, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import { VendorCustomerNotifyPreview } from 'client/portal/vendor/customers/VendorCustomerNotifyPreview';
import { NotificationMacro } from 'common/enums';
import * as React from 'react';
import { useRef } from 'react';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSwitch from 'shared/components/form/FormSwitch';
import FormText from 'shared/components/form/FormText';
import { FormTextObject } from 'shared/components/form/FormText/FormTextCommon';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { ManualNotification, NotificationMethod, NotificationType, VendorBuyerNotifyDocument } from 'shared/generated';
import { useMutationPromise } from 'shared/Graph';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

export function VendorCustomerNotify({ buyerRelId }: { buyerRelId: string }) {
  const initial: Omit<ManualNotification, 'notificationChannels'> & {
    notificationChannels: Record<NotificationMethod, boolean>;
  } = {
    message: '',
    subject: '',
    channel: '',
    notificationChannels: {
      ...Object.values(NotificationMethod).reduce((result, value) => ({ ...result, [value]: false }), {}),
    } as Record<NotificationMethod, boolean>,
  };

  const state = useState(initial);
  const messageRef = useRef<FormTextObject>();
  const addMacro = (macro: string) => {
    messageRef.current?.addText(` {{${macro}}}`);
  };

  const subjectRef = useRef<FormTextObject>();
  const addSubjectMacro = (macro: string) => {
    subjectRef.current?.addText(` {{${macro}}}`);
  };

  ValidationAttach(state, (validator) => {
    validator.message.required();
    validator.when((s) => s.notificationChannels[NotificationMethod.Email].get()).subject.required();
    validator.when((s) => s.notificationChannels[NotificationMethod.Slack].get()).channel.required();
    validator.notificationChannels.validate((x) => Object.values(x).some((value) => value));
  });

  const buyerNotify = useMutationPromise(VendorBuyerNotifyDocument);

  return (
    <>
      <SlidebarHeader title="Notify Customer" />
      <SlidebarContent>
        <FormGroup>
          <FormHorizontal state={state.notificationChannels} name="Methods">
            <div className="flex space-x-2">
              {Object.entries(NotificationMethod).map(([key, value]) => (
                <FormSwitch state={state.notificationChannels[value]} label={key} key={key} />
              ))}
            </div>
          </FormHorizontal>
          {state.notificationChannels[NotificationMethod.Email].get() && (
            <FormHorizontal state={state.subject} lang="notification.subject">
              <VendorCustomerNotifyPreview
                macros={notificationTypeToMacros[NotificationType.Manual].filter(
                  (x) => x !== NotificationMacro.RANGE_END && x !== NotificationMacro.RANGE_START
                )}
                messageState={state.subject}
                addMacro={addSubjectMacro}
              >
                <FormText state={state.subject} objectRef={subjectRef} />
              </VendorCustomerNotifyPreview>
            </FormHorizontal>
          )}
          {state.notificationChannels[NotificationMethod.Slack].get() && (
            <FormHorizontal state={state.channel} lang="notification.channel">
              <FormText state={state.channel} />
            </FormHorizontal>
          )}
          <FormHorizontal state={state.message} lang="notification.message">
            <VendorCustomerNotifyPreview
              macros={notificationTypeToMacros[NotificationType.Manual].filter(
                (x) => x !== NotificationMacro.RANGE_END && x !== NotificationMacro.RANGE_START
              )}
              messageState={state.message}
              addMacro={addMacro}
            >
              <FormText state={state.message} lines={5} objectRef={messageRef} />
            </VendorCustomerNotifyPreview>
          </FormHorizontal>
        </FormGroup>

        <SlidebarCloseButton style={ButtonStyle.QUIET}>Cancel</SlidebarCloseButton>
        <SlidebarCloseButton
          disabled={!Validation(state).valid(true)}
          onClick={async () => {
            await buyerNotify({
              buyerRelId,
              data: {
                message: state.message.get(),
                subject: state.notificationChannels[NotificationMethod.Email].get() ? state.subject.get() : null,
                channel: state.notificationChannels[NotificationMethod.Slack].get() ? state.subject.get() : null,
                notificationChannels: Object.entries(state.notificationChannels.get())
                  .filter((x) => x[1])
                  .map((x) => x[0] as NotificationMethod),
              },
            });
          }}
        >
          Send
        </SlidebarCloseButton>
      </SlidebarContent>
    </>
  );
}
