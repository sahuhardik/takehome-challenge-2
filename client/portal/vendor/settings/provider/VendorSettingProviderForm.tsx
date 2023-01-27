import { none, State, useState } from '@hookstate/core';
import FormColor from 'client/global/components/form/FormColor';
import FormUserRoles from 'client/global/components/form/FormUserRoles';
import Card from 'client/global/components/tailwind/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import Tabs, { Tab } from 'client/global/components/tailwind/Tabs';
import Toolbar from 'client/global/components/tailwind/Toolbar';
import VendorSettingProviderPerformable from 'client/portal/vendor/settings/provider/VendorSettingProviderPerformable';
import { defaultBusinessHours } from 'client/portal/vendor/settings/provider/VendorSettingProviderRouter';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import * as React from 'react';
import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmationButton from 'shared/components/button/ConfirmationButton';
import PromiseButton from 'shared/components/button/PromiseButton';
import FormAddress from 'shared/components/form/FormAddress/FormAddress';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  DayBusinessHoursWrite,
  PerformableType,
  ProviderWrite,
  RoleType,
  TimeRangeWrite,
  TimeWrite,
  VendorProviderGetQuery,
  VendorSettingsProviderDocument,
} from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import DeleteIcon from 'shared/icons/DeleteIcon';
import EditIcon from 'shared/icons/EditIcon';
import { Validation } from 'shared/utilities/Validation';

dayjs.extend(weekday);

export function range(from: number, to: number, step = 1) {
  const result = [];
  for (let i = from; i <= to; i += step) {
    result.push(i);
  }
  return result;
}

export function TimePicker({
  state,
  disableBefore,
  disableAfter,
}: {
  state: State<TimeWrite>;
  disableBefore?: State<TimeWrite>;
  disableAfter?: State<TimeWrite>;
}) {
  const scoped = useState(state);

  const options = useCallback(
    (list: number[]) =>
      list.map((x) => ({
        value: String(x),
        label: String(x).padStart(2, '0'),
      })),
    []
  );

  const hours = useMemo(() => options(range(0, 23)), [options]);
  const minutes = useMemo(() => options(range(0, 55, 5)), [options]);

  const date = (x: TimeWrite): dayjs.Dayjs => {
    return dayjs().hour(x.hour).minute(x.minute);
  };

  const isDisabled = (x: TimeWrite) => {
    return (
      (disableBefore && !date(x).isAfter(date(disableBefore.get()))) ||
      (disableAfter && !date(x).isBefore(date(disableAfter.get())))
    );
  };

  return (
    <div className="flex items-stretch">
      <select
        className="p-1 bg-none rounded border-gray-200 block focus:outline-none sm:text-sm"
        value={String(scoped.hour.get())}
        onChange={(e) => scoped.hour.set(parseInt(e.target.value || '0'))}
      >
        {hours.map(({ value, label }) => (
          <option
            value={value}
            key={value}
            disabled={isDisabled({ hour: parseInt(value), minute: scoped.minute.get() })}
          >
            {label}
          </option>
        ))}
      </select>
      <div className="p-1 sm:text-sm flex items-center font-bold">:</div>
      <select
        className="p-1 bg-none rounded border-gray-200 block focus:outline-none sm:text-sm"
        value={String(scoped.minute.get())}
        onChange={(e) => scoped.minute.set(parseInt(e.target.value || '0'))}
      >
        {minutes.map(({ value, label }) => (
          <option value={value} key={value} disabled={isDisabled({ hour: scoped.hour.get(), minute: parseInt(value) })}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TimeRangePicker({ state }: { state: State<TimeRangeWrite> }) {
  const scoped = useState(state);
  return (
    <div className="flex items-center space-x-4">
      <TimePicker state={scoped.from} disableAfter={scoped.to} />
      <div className="text-xl mx-1">-</div>
      <TimePicker state={scoped.to} disableBefore={scoped.from} />
      <Button onClick={scoped.set.bind(scoped, none)} icon={<DeleteIcon />} style={ButtonStyle.QUIET} />
    </div>
  );
}

export function BusinessHours({
  state,
  showDefault = null,
  defaultTitle = 'Default: every day, all day',
  button = 'Config',
  buttonIcon = <AddIcon />,
}: {
  state: State<DayBusinessHoursWrite[] | null>;
  showDefault: DayBusinessHoursWrite[] | null;
  defaultTitle?: string;
  button?: string;
  buttonIcon?: React.ReactElement;
}) {
  const scoped = useState(state);
  return scoped.get() === null ? (
    showDefault?.length === 7 ? (
      <Table card className="cursor-not-allowed	bg-gray-300">
        <TableHead>
          <TableRow>
            <TableHeadCell slim className="text-black">
              {defaultTitle}
            </TableHeadCell>
            <TableHeadCell slim>
              <Button
                onClick={() => scoped.set(showDefault?.length === 7 ? [...showDefault] : defaultBusinessHours())}
                icon={buttonIcon}
                right
                style={ButtonStyle.QUIET}
                className="pl-0"
              >
                {button}
              </Button>
            </TableHeadCell>
          </TableRow>
        </TableHead>
        <TableHead>
          <TableRow>
            <TableHeadCell slim>Day of Week</TableHeadCell>
            <TableHeadCell slim>Business Hours</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {showDefault.map((x, i) => (
            <TableRow key={i}>
              <TableCell slim className="font-bold bg-gray-50">
                {dayjs().weekday(i).format('dddd')}
              </TableCell>
              <TableCell slim className="bg-gray-50">
                <div className="flex flex-col items-start">
                  {x.hours && x.hours.from && x.hours.to ? (
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <div>{String(x.hours.from.hour).padStart(2, '0')}</div>
                        <div className="p-1 sm:text-sm flex items-center font-bold">:</div>
                        <div>{String(x.hours.from.minute).padStart(2, '0')}</div>
                      </div>
                      <div className="text-xl mx-1 items-center">-</div>
                      <div className="flex items-center">
                        <div>{String(x.hours.to.hour).padStart(2, '0')}</div>
                        <div className="p-1 sm:text-sm flex items-center font-bold">:</div>
                        <div>{String(x.hours.to.minute).padStart(2, '0')}</div>
                      </div>
                    </div>
                  ) : (
                    '-'
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ) : (
      <Button
        onClick={() => scoped.set(showDefault?.length === 7 ? [...showDefault] : defaultBusinessHours())}
        icon={buttonIcon}
        right
        style={ButtonStyle.QUIET}
        className="pl-0"
      >
        {button}
      </Button>
    )
  ) : (
    <Card onRemove={() => scoped.set(null)}>
      <Table card>
        <TableHead>
          <TableRow>
            <TableHeadCell slim>Day of Week</TableHeadCell>
            <TableHeadCell slim>Business Hours</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {scoped.map((x, i) => (
            <TableRow key={i}>
              <TableCell slim className="font-bold">
                {dayjs().weekday(i).format('dddd')}
              </TableCell>
              <TableCell slim>
                <div className="flex flex-col items-start">
                  {x.hours && x.hours.from && x.hours.to ? (
                    <TimeRangePicker state={x.hours} />
                  ) : (
                    <Button
                      onClick={x.set.bind(x, {
                        hours: {
                          from: { hour: 0, minute: 0 },
                          to: { hour: 23, minute: 59 },
                        },
                      })}
                      icon={<AddIcon />}
                      style={ButtonStyle.QUIET}
                      className="pl-0"
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function ProviderGeneral({
  state,
  provider,
}: {
  state: State<ProviderWrite>;
  provider?: VendorProviderGetQuery['provider'];
}) {
  const { vendorId } = useParams();
  const { vendor } = useQueryHook(VendorSettingsProviderDocument, { vendorId }, 'cache-and-network');

  const scopedState = useState(state);

  return (
    <FormGroup>
      <FormHorizontal state={scopedState.company} name="Name">
        <FormText state={scopedState.company} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.color} name="Color">
        <FormColor state={scopedState.color} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.address} name="Address">
        <FormAddress state={scopedState.address} coords={vendor.address} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.users} name="Users">
        <FormUserRoles
          state={scopedState.users}
          roles={vendor.roles.filter((r) => r.type === RoleType.Provider)}
          defaultRoles={vendor.defaultRoles.map((r) => ({ ...r, default: true }))}
          timezone={vendor.timezone}
          ownerId={vendor.id}
          memberId={provider?.member?.id}
          checkMemberIds={[vendor.id]}
        />
      </FormHorizontal>
      <FormHorizontal state={scopedState.businessHours} name="Business Hours">
        <BusinessHours
          state={state.businessHours}
          showDefault={vendor.businessHours?.length === 7 ? [...vendor.businessHours] : defaultBusinessHours()}
          defaultTitle={vendor.businessHours ? 'Default from Settings / General' : undefined}
          button={vendor.businessHours ? 'Override' : undefined}
          buttonIcon={vendor.businessHours ? <EditIcon /> : undefined}
        />
      </FormHorizontal>
    </FormGroup>
  );
}

interface FormProps {
  state: State<ProviderWrite>;
  provider?: VendorProviderGetQuery['provider'];
  mutation: (data: ProviderWrite) => Promise<void>;
  remove?: (id: string) => Promise<void>;
  title: string;
}

export default function VendorSettingsProviderForm({ state, mutation, remove, title, provider }: FormProps) {
  const tabs: Tab[] = [
    {
      key: 'general',
      name: 'General',
      useElement: <ProviderGeneral state={state} provider={provider} />,
    },
    {
      key: 'service',
      name: 'Services',
      useElement: <VendorSettingProviderPerformable state={state} type={PerformableType.Service} name="Service" />,
    },
    {
      key: 'tasks',
      name: 'Tasks',
      useElement: <VendorSettingProviderPerformable state={state} type={PerformableType.Task} name="Task" />,
    },
    {
      key: 'delivery',
      name: 'Deliveries',
      useElement: <VendorSettingProviderPerformable state={state} type={PerformableType.Delivery} name="Delivery" />,
    },
  ];

  const navigate = useNavigate();

  const actions = [];
  if (provider?.id && remove) {
    actions.push(
      <ConfirmationButton
        key="delete"
        style={ButtonStyle.DANGER}
        icon={<DeleteIcon />}
        disabled={provider.removable ? false : 'Cannot delete provider with captured payments.'}
        onClick={async () => {
          await remove(provider.id);
          navigate('../');
        }}
        title="Remove Provider"
        description="Are you sure you want to remove this provider?"
        confirmText="Delete Provider"
      >
        Delete Provider
      </ConfirmationButton>
    );
  }
  actions.push(
    <PromiseButton
      key="save"
      onClick={async () => {
        await mutation(state.get());

        navigate('../');
      }}
      disabled={!Validation(state).valid(true)}
    >
      Save
    </PromiseButton>
  );

  return (
    <Toolbar title={title} actions={actions}>
      <Tabs tabs={tabs} />
    </Toolbar>
  );
}
