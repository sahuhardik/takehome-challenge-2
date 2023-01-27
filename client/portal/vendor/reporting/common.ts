import { Query } from '@cubejs-client/core';
import { ReportMeasures } from 'client/portal/vendor/reporting/queries';
import dayjs from 'dayjs';
import { getTimezone } from 'shared/state/TimezoneState';

export interface ReportState {
  query: Query;
}

export const emptyQuery: Query = {
  filters: [],
  measures: [ReportMeasures.ORDER_REVENUE],
  dimensions: [],
  timeDimensions: [],
  timezone: getTimezone(),
};

export function defaultReportRange(): [string, string] {
  return [dayjs().utc().subtract(1, 'year').startOf('month').toISOString(), dayjs().utc().endOf('month').toISOString()];
}
