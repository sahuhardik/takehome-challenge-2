import { useState } from '@hookstate/core';
import { SlidebarCloseButton } from 'client/global/components/button/SlidebarOpenButton';
import { notificationTypeToMacros } from 'client/global/components/form/notificationTypeToMacros';
import { SlidebarContent, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import { VendorCustomerNotifyPreview } from 'client/portal/vendor/customers/VendorCustomerNotifyPreview';
import dayjs from 'dayjs';
import * as React from 'react';
import { useRef } from 'react';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSwitch from 'shared/components/form/FormSwitch';
import FormText from 'shared/components/form/FormText';
import { FormTextObject } from 'shared/components/form/FormText/FormTextCommon';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import {
  ManualNotification,
  NotificationMethod,
  NotificationType,
  RangeAppointmentsDocument,
  VendorAppointmentsNotifyDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

interface RangeAppointmentsProps {
  vendorId: string;
  start: string;
  end: string;
}

function RangeAppointments({ start, end, vendorId }: RangeAppointmentsProps) {
  const rangeAppointments = useQueryHook(RangeAppointmentsDocument, {
    start,
    end,
    vendorId,
  });

  return (
    <div className="flex flex-col space-y-2 my-4">
      {rangeAppointments.rangeAppointments.length ? (
        rangeAppointments.rangeAppointments.map((buyer) => <div key={buyer.id}>{buyer.company}</div>)
      ) : (
        <Message type={MessageType.INFO}>No customers with appointments</Message>
      )}
    </div>
  );
}

export function VendorCustomerAppointmentsNotify({ vendorId }: { vendorId: string }) {
  const initial: Omit<ManualNotification, 'notificationChannels'> & {
    start: string;
    end: string;
    notificationChannels: Record<NotificationMethod, boolean>;
  } = {
    start: dayjs().startOf('day').format('YYYY-MM-DDTHH:mm'),
    end: dayjs().endOf('day').format('YYYY-MM-DDTHH:mm'),
    message: '',
    subject: '',
    channel: '',
    notificationChannels: {
      ...Object.values(NotificationMethod).reduce((result, value) => ({ ...result, [value]: false }), {}),
    } as Record<NotificationMethod, boolean>,
  };

  const state = useState(initial);
  const showBuyers = useState<RangeAppointmentsProps | null>(null);
  const messageRef = useRef<FormTextObject>();
  const addMacro = (macro: string) => {
    messageRef.current?.addText(` {{${macro}}}`);
  };

  const subjectRef = useRef<FormTextObject>();
  const addSubjectMacro = (macro: string) => {
    subjectRef.current?.addText(` {{${macro}}}`);
  };

  ValidationAttach(state, (validator) => {
    validator.start.required();
    validator.end.required();
    validator.message.required();
    validator.when((s) => s.notificationChannels[NotificationMethod.Email].get()).subject.required();
    validator.when((s) => s.notificationChannels[NotificationMethod.Slack].get()).channel.required();
  });

  const appointmentsNotify = useMutationPromise(VendorAppointmentsNotifyDocument);

  return (
    <>
      <SlidebarHeader title="Notify Customer Appointments" />
      <SlidebarContent>
        <FormGroup>
          <FormHorizontal state={state.start} name="From">
            <FormText state={state.start} type="datetime-local" onChange={() => showBuyers.set(null)} />
          </FormHorizontal>
          <FormHorizontal state={state.end} name="To">
            <FormText state={state.end} type="datetime-local" onChange={() => showBuyers.set(null)} />
          </FormHorizontal>
          <Button
            style={ButtonStyle.SECONDARY}
            onClick={() =>
              showBuyers.set({
                vendorId,
                start: state.start.get(),
                end: state.end.get(),
              })
            }
          >
            Show Customers
          </Button>
          {showBuyers.get() && <RangeAppointments {...showBuyers.get()} />}
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
                macros={notificationTypeToMacros[NotificationType.Manual]}
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
              macros={notificationTypeToMacros[NotificationType.Manual]}
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
            await appointmentsNotify({
              vendorId,
              start: dayjs(state.start.get()).toISOString(),
              end: dayjs(state.end.get()).toISOString(),
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
