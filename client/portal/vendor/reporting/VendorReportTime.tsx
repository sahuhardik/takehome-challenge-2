import { Query } from '@cubejs-client/core';
import { State, useState } from '@hookstate/core';
import { defaultReportRange } from 'client/portal/vendor/reporting/common';
import { dimensionMapping, measureMapping, ReportTime } from 'client/portal/vendor/reporting/queries';
import React from 'react';
import FormSelectView from 'shared/components/form/FormSelect/FormSelectView';

export default function VendorReportTime({ state }: { state: State<Query> }) {
  const scope = useState(state);

  const dimensions = scope.dimensions.get();

  let options: ReportTime[];

  if (dimensions.length) {
    for (const dimension of dimensions) {
      const times = dimensionMapping[dimension].times;

      if (!options) {
        options = times;
      } else {
        options = options.filter((o) => times.includes(o));
      }
    }
  } else {
    const measures = scope.measures.get();

    for (const measure of measures) {
      const times = measureMapping[measure].times;

      if (!options) {
        options = times;
      } else {
        options = options.filter((o) => times.includes(o));
      }
    }
  }

  const time = scope.timeDimensions.length ? scope.timeDimensions[0].dimension.get() : null;

  return (
    <FormSelectView
      key={time || 'none'}
      value={time}
      onChange={(value) => {
        if (scope.timeDimensions.length) {
          scope.timeDimensions[0].dimension.set(value);
        } else {
          scope.timeDimensions.set([{ dimension: value, dateRange: defaultReportRange() }]);
        }
      }}
      valid
      disabled={options.length === 1}
      required
      options={options.map((o) => ({ label: o, value: o }))}
    />
  );
}
