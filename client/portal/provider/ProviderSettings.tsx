import NavigationButton from 'client/global/components/button/NavigationButton';
import Badge, { BadgeType } from 'client/global/components/tailwind/Badge';
import Center from 'client/global/components/tailwind/Center';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  ProviderDisconnectGoogleDocument,
  ProviderSetBusyCalendarDocument,
  ProviderSettingsSchedulingDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import BanIcon from 'shared/icons/BanIcon';
import GoogleIcon from 'shared/icons/GoogleIcon';

export default function ProviderSettings() {
  const { providerMemberId } = useParams();

  const { member } = useQueryHook(ProviderSettingsSchedulingDocument, { memberId: providerMemberId });
  const disconnect = useMutationPromise(ProviderDisconnectGoogleDocument);
  const setBusyCalendar = useMutationPromise(ProviderSetBusyCalendarDocument);

  return (
    <Center small padding>
      <FormGroup>
        <FormHorizontal name="Google Calendar">
          <div>
            <div className="flex items-center space-x-2">
              <div className="icon-lg">
                <GoogleIcon />
              </div>
              {member.calendarSyncEnabled ? (
                <>
                  <Badge type={BadgeType.POSITIVE}>Configured</Badge>
                  <PromiseButton
                    icon={<BanIcon />}
                    style={ButtonStyle.SECONDARY}
                    onClick={async () => {
                      await disconnect({ memberId: providerMemberId });
                    }}
                  >
                    Disconnect
                  </PromiseButton>
                </>
              ) : (
                <>
                  <Badge type={BadgeType.NEGATIVE}>Disconnected</Badge>
                  <NavigationButton
                    link={`/api/google/connect?member=${providerMemberId}`}
                    icon={<AddIcon />}
                    style={ButtonStyle.SECONDARY}
                  >
                    Connect
                  </NavigationButton>
                </>
              )}
            </div>
            {member.calendarSyncEnabled ? (
              <>
                <p className="mt text-sm">Choose a calendar below to sync your schedule to:</p>
                <div className="mt space-y-4">
                  <Table card>
                    <TableHead>
                      <TableRow>
                        <TableHeadCell>Calendar</TableHeadCell>
                        <TableHeadCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {member.externalCalendars.map((calendar) => (
                        <TableRow key={calendar.id}>
                          <TableCell>{calendar.name}</TableCell>
                          <TableCell>
                            <PromiseButton
                              style={calendar.busy ? ButtonStyle.PRIMARY : ButtonStyle.SECONDARY}
                              onClick={async () => {
                                // Toogle Busy
                                await setBusyCalendar({ calendarId: calendar.id, busy: !calendar.busy });
                              }}
                            >
                              Busy
                            </PromiseButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : null}
          </div>
        </FormHorizontal>
      </FormGroup>
    </Center>
  );
}
