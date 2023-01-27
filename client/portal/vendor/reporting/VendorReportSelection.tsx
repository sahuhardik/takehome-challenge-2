import { Query } from '@cubejs-client/core';
import { none, State, useState } from '@hookstate/core';
import { ButtonGroup } from 'client/global/components/button/ButtonGroup';
import Selectable from 'client/global/components/tailwind/Selectable';
import Slidebar, { SlidebarContent, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import { defaultReportRange, emptyQuery } from 'client/portal/vendor/reporting/common';
import queries, { dimensionMapping, measureMapping } from 'client/portal/vendor/reporting/queries';
import React from 'react';
import FormSelectView from 'shared/components/form/FormSelect/FormSelectView';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import AddIcon from 'shared/icons/AddIcon';
import DeleteIcon from 'shared/icons/DeleteIcon';
import SettingsIcon from 'shared/icons/SettingsIcon';

export default function VendorReportSelection({ state }: { state: State<Query> }) {
  const scope = useState(state);
  const local = useState({
    title: 'Service Revenue',
    show: false,
    custom: false,
    builder: emptyQuery,
  });

  const button = (
    <Button style={ButtonStyle.SECONDARY} icon={<SettingsIcon />} onClick={() => local.show.set(true)}>
      {local.title.get()}
    </Button>
  );

  let group = <></>;
  let interval = <></>;

  if (local.builder.measures.length > 0) {
    group = (
      <div className="space-y-2">
        <div className="font-semibold">Step 2. Group By (Optional)</div>
        <FormSelectView
          value={local.builder.dimensions[0] && local.builder.dimensions[0].get()}
          onChange={(value) => local.builder.dimensions.set(value ? [value] : [])}
          valid={true}
          required={false}
          options={Object.keys(dimensionMapping).map((m) => ({ value: m, label: m }))}
        />
      </div>
    );

    const intervalRequired = local.builder.dimensions.length === 0;

    interval = (
      <div className="space-y-2 mt">
        <div className="font-semibold">Step 3. Interval ({intervalRequired ? 'Required' : 'Optional'})</div>
        <FormSelectView
          value={local.builder.timeDimensions.length ? local.builder.timeDimensions[0].granularity.get() : undefined}
          onChange={(value) => {
            local.builder.set((query) => {
              if (!value) {
                query.timeDimensions = [];
              } else {
                if (!query.timeDimensions[0]) {
                  const dimension = query.dimensions[0];

                  const timeDimension = dimension
                    ? dimensionMapping[dimension].times[0]
                    : measureMapping[query.measures[0]].times[0];

                  query.timeDimensions.push({ dimension: timeDimension, dateRange: defaultReportRange() });
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                query.timeDimensions[0].granularity = value as any;
              }

              return query;
            });
          }}
          valid
          required={false}
          options={[
            { value: 'quarter', label: 'Quarterly' },
            { value: 'month', label: 'Monthly' },
            { value: 'week', label: 'Weekly' },
            { value: 'year', label: 'Yearly' },
          ]}
        />
      </div>
    );
  }

  const measures = local.builder.measures.get();

  const valid =
    local.builder.measures.length > 0 &&
    (local.builder.dimensions.length > 0 || local.builder.timeDimensions.length > 0);

  return (
    <>
      <Slidebar show={local.show.get()} onClose={() => local.show.set(false)}>
        <SlidebarHeader title="Choose Report" />
        <SlidebarContent>
          {local.custom.get() === true && (
            <>
              <div className="space-y-2">
                <div className="font-semibold">Step 1. Choose Measures</div>
                {local.builder.measures.map((measure, index) => {
                  const options = Object.keys(measureMapping)
                    .filter((m) => measure.get() === m || !measures.includes(m))
                    .map((m) => ({ value: m, label: m }));

                  return (
                    <div className="flex items-center" key={measure.get()}>
                      {index > 0 && (
                        <Button style={ButtonStyle.DANGER} icon={<DeleteIcon />} onClick={() => measure.set(none)} />
                      )}
                      <FormSelectView
                        value={measure.get()}
                        onChange={(value) => measure.set(value)}
                        valid
                        required={false}
                        options={options}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="text-right mb-6">
                <Button style={ButtonStyle.QUIET} icon={<AddIcon />} onClick={() => local.builder.measures.merge([''])}>
                  Add Measure
                </Button>
              </div>
              {group}
              {interval}
              <ButtonGroup className="mt">
                <Button style={ButtonStyle.QUIET} onClick={() => local.custom.set(false)}>
                  Back
                </Button>
                <Button
                  disabled={!valid}
                  onClick={() => {
                    scope.set(JSON.parse(JSON.stringify(local.builder.get())));

                    local.merge({ custom: false, show: false, title: 'Custom Report' });
                  }}
                >
                  Run Report
                </Button>
              </ButtonGroup>
            </>
          )}
          {local.custom.get() === false && (
            <>
              <Selectable
                title="Custom Report"
                onClick={() => {
                  local.custom.set(true);
                }}
              >
                Choose your own metrics and customize grouping capabilities.
              </Selectable>

              <div className="space-y-2">
                <div className="text-lg font-semibold mt">Premade Reports</div>
                {Object.entries(queries).map(([type, { title, desc, query }]) => (
                  <Selectable
                    key={type}
                    title={title}
                    onClick={() => {
                      const dimension = (query.dimensions || [])[0];

                      const timeDimension = dimension
                        ? dimensionMapping[dimension].times[0]
                        : measureMapping[query.measures[0]].times[0];

                      const timeDimensions = [{ dimension: timeDimension, dateRange: defaultReportRange() }];

                      const newQuery = {
                        ...emptyQuery,
                        timeDimensions,
                        ...query,
                      };

                      if (!newQuery.timeDimensions) {
                        newQuery.timeDimensions = timeDimensions;
                      } else if (!newQuery.timeDimensions[0].dateRange) {
                        newQuery.timeDimensions[0].dateRange = defaultReportRange();
                      }

                      scope.set(newQuery);

                      local.merge({
                        title,
                        show: false,
                      });
                    }}
                  >
                    {desc}
                  </Selectable>
                ))}{' '}
              </div>
            </>
          )}
        </SlidebarContent>
      </Slidebar>
      {button}
    </>
  );
}
