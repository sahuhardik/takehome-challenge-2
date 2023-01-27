import { Query } from '@cubejs-client/core';
import { none, State, useState } from '@hookstate/core';
import DatePicker from 'client/global/components/DatePicker';
import VendorReportSelection from 'client/portal/vendor/reporting/VendorReportSelection';
import VendorReportTime from 'client/portal/vendor/reporting/VendorReportTime';
import React from 'react';
import FormSelectView from 'shared/components/form/FormSelect/FormSelectView';
import ScheduleIcon from 'shared/icons/ScheduleIcon';
import TimeIcon from 'shared/icons/TimeIcon';
import WeekIcon from 'shared/icons/WeekIcon';
import { tz } from 'shared/state/TimezoneState';

export default function VendorReportBar({ state }: { state: State<Query> }) {
  const scoped = useState(state);

  const time = scoped.timeDimensions;

  const interval = time.length ? time[0].granularity.get() : null;
  const from = time.length && time[0].dateRange[0] ? new Date(time[0].dateRange[0].get()) : null;
  const to = time.length && time[0].dateRange[0] ? new Date(time[0].dateRange[1].get()) : null;

  // TODO: similar styling to select
  let style = 'px-3 py-2 border border-gray-300 rounded-md text-sm';

  if (time.length === 0) {
    style += ' cursor-not-allowed bg-disabled text-gray-400';
  } else {
    style += ' cursor-pointer bg-white hover:border-theme-secondary';
  }

  return (
    <div className="flex justify-between">
      <span className="relative z-0 inline-flex shadow-sm rounded-md">
        <VendorReportSelection state={scoped} />
      </span>
      <div className="flex items-center space-x">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4">
            <TimeIcon />
          </div>
          <VendorReportTime state={scoped} />
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4">
            <ScheduleIcon />
          </div>
          <div className="flex items-center space-x-1">
            <div className={style}>
              <DatePicker
                disabled={time.length === 0}
                onChange={(date) => {
                  if (from) {
                    time[0].dateRange[0].set(date.toISOString());
                  }
                }}
                value={from}
              >
                {from ? tz(from).format('MM/DD/YYYY') : 'Start'}
              </DatePicker>
            </div>
            <span>-</span>
            <div className={style}>
              <DatePicker
                disabled={time.length === 0}
                onChange={(date) => {
                  if (to) {
                    time[0].dateRange[1].set(date.toISOString());
                  }
                }}
                value={to}
              >
                {to ? tz(to).format('MM/DD/YYYY') : 'End'}
              </DatePicker>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4">
            <WeekIcon />
          </div>
          <div className="w-32">
            <FormSelectView
              key={interval || 'none'}
              value={interval}
              onChange={(value) => time[0].granularity.set(value || none)}
              valid
              disabled={time.length === 0}
              required={scoped.dimensions.length === 0}
              placeholder="No Interval"
              options={[
                { value: 'year', label: 'Yearly' },
                { value: 'quarter', label: 'Quarterly' },
                { value: 'month', label: 'Monthly' },
                { value: 'week', label: 'Weekly' },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
