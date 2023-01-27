import { useState } from '@hookstate/core';
import NavigationButton from 'client/global/components/button/NavigationButton';
import Badge, { BadgeType } from 'client/global/components/tailwind/Badge';
import Center from 'client/global/components/tailwind/Center';
import Link from 'client/global/components/tailwind/Link';
import { VendorSettingsContext } from 'client/portal/vendor/settings/VendorSettingsData';
import * as React from 'react';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormNumber from 'shared/components/form/FormNumber';
import FormSwitch from 'shared/components/form/FormSwitch';
import FormText from 'shared/components/form/FormText';
import {
  DisconnectGoogleDocument,
  VendorSetCalendarDocument,
  VendorSettingsSchedulingDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import EditIcon from 'shared/icons/EditIcon';
import GoogleIcon from 'shared/icons/GoogleIcon';

// TODO: connect google

export default function VendorSettingsScheduling() {
  const { vendorId } = useParams();
  const { settings } = useContext(VendorSettingsContext);
  const state = useState(settings);

  const { vendor } = useQueryHook(VendorSettingsSchedulingDocument, { vendorId });

  const refresh = useQueryPromise(VendorSettingsSchedulingDocument);
  const selectCalendar = useMutationPromise(VendorSetCalendarDocument);
  const disconnectCalendar = useMutationPromise(DisconnectGoogleDocument);
  const change = useState(false);

  return (
    <Center padding>
      <FormGroup>
        <FormHorizontal name="Google Calendar">
          {!vendor.calendarSyncEnabled ? (
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="icon-lg">
                  <GoogleIcon />
                </div>
                <Badge type={BadgeType.NEGATIVE}>Disconnected</Badge>
              </div>
              <NavigationButton link={`/api/google/connect?member=${vendorId}`}>Connect</NavigationButton>
            </div>
          ) : !change.get() && vendor.calendarSyncConfigured ? (
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="icon-lg">
                  <GoogleIcon />
                </div>
                <Badge type={BadgeType.POSITIVE}>Configured</Badge>
                <Link
                  onClick={() => {
                    change.set(true);
                  }}
                  className="text-medium text-sm"
                  icon={<EditIcon />}
                >
                  {vendor.writeCalendar.name}
                </Link>
              </div>
              <PromiseButton
                onClick={async () => {
                  await disconnectCalendar({ memberId: vendorId });
                  await refresh({ vendorId });
                }}
              >
                Disconnect
              </PromiseButton>
            </div>
          ) : (
            <div>
              <div className="flex items-center space-x-2">
                <div className="icon-lg">
                  <GoogleIcon />
                </div>
                <Badge type={BadgeType.WARNING}>Unconfigured</Badge>
              </div>
              <p className="mt text-sm">Choose a calendar below to sync your schedule to:</p>
              <div className="mt space-y-4">
                {vendor.calendars.map((calendar) => (
                  <div key={calendar.id}>
                    <PromiseButton
                      key={calendar.id}
                      onClick={async () => {
                        await selectCalendar({ vendorId, calendarId: calendar.id });

                        await refresh({ vendorId });

                        change.set(false);
                      }}
                    >
                      {calendar.name}
                    </PromiseButton>
                  </div>
                ))}
              </div>
            </div>
          )}
        </FormHorizontal>
        <FormHorizontal state={state.buyerReminderMinutes}>
          <FormNumber state={state.buyerReminderMinutes} />
        </FormHorizontal>
        <FormHorizontal state={state.buyerDailyReminder}>
          <div className="w-32">
            <FormText state={state.buyerDailyReminder} type="time" />
          </div>
        </FormHorizontal>
        <FormHorizontal state={state.inlineScheduling}>
          <FormSwitch state={state.inlineScheduling} />
        </FormHorizontal>
        <FormHorizontal state={state.collapseTimeSlots}>
          <FormSwitch state={state.collapseTimeSlots} />
        </FormHorizontal>
        <FormHorizontal state={state.requestTimesError}>
          <FormSwitch state={state.requestTimesError} />
        </FormHorizontal>
        <FormHorizontal state={state.requireRequestTimes} name="Require Request Times">
          <FormSwitch state={state.requireRequestTimes} />
        </FormHorizontal>
      </FormGroup>
    </Center>
  );
}
