import { Query } from '@cubejs-client/core';
import { CubeContext, QueryBuilder, useCubeQuery } from '@cubejs-client/react';
import { State, useState } from '@hookstate/core';
import { ChartDataset, ChartOptions } from 'chart.js';
import 'chart.js/auto';
import 'chartjs-adapter-dayjs-3';
import Card from 'client/global/components/tailwind/Card';
import Center from 'client/global/components/tailwind/Center';
import Spinner from 'client/global/components/tailwind/Spinner';
import { defaultReportRange, emptyQuery } from 'client/portal/vendor/reporting/common';
import queries, { dimensionMapping, PremadeVendorReport } from 'client/portal/vendor/reporting/queries';
import VendorReportBar from 'client/portal/vendor/reporting/VendorReportBar';
import React, { useContext } from 'react';
import { Chart } from 'react-chartjs-2';
import { getTimezone, tz } from 'shared/state/TimezoneState';

interface Axis {
  keys: string[];
  currency: boolean;
}

type Row = {
  [key: string]: number | Date | string;
};

const colorTrue = '#4ADE80';
const colorFalse = '#F87171';

// https://learnui.design/tools/data-color-picker.html#palette
const colors = [
  '#4f46e5', // stop
  '#0072ff',
  '#0093ff',
  '#00afff',
  '#00dce7',
  '#00dce7',
  '#00efc5',
  '#00ffa4', // stop
  '#ff96bc', // stop
  '#fd84ba',
  '#f871bb', // stop
  '#ff72a4',
  '#ff7b87',
  '#ff8f67',
  '#ffa944',
  '#ffc71b',
  '#ffe400',
  '#d5ff0f',
];
const colorStep = Math.ceil(Math.sqrt(colors.length));

const RenderChart = ({
  resultSet,
  state,
}: {
  resultSet: ReturnType<typeof useCubeQuery>['resultSet'];
  state: State<Query>;
}) => {
  const scoped = useState(state);
  const a = resultSet.annotation();

  const interval = resultSet.query().timeDimensions[0]?.granularity;
  const dateKey = Object.keys(a.timeDimensions)[0];

  const measures = Object.entries(a.measures);

  if (!measures[0]) {
    return <></>;
  }

  const dimensions = Object.entries(a.dimensions);

  const currencyMeasures = measures.filter((v) => v[1].format === 'currency');

  const left: Axis = {
    keys: [],
    currency: currencyMeasures.length > 0,
  };

  if (left.currency) {
    left.keys = currencyMeasures.map((m) => m[0]);
  } else if (measures.length === 2) {
    left.keys = [measures[0][0]];
  } else {
    left.keys = measures.map((m) => m[0]);
  }

  let right: Axis;

  if (left.keys.length !== measures.length) {
    right = {
      keys: measures.map((m) => m[0]).filter((m) => !left.keys.includes(m)),
      currency: false,
    };

    // TODO: use math to determine if we should break up
    const averages = currencyMeasures.filter((m) => m[1].title.includes('Avg') || m[1].title.includes('Average'));

    if (averages.length) {
      left.keys = left.keys.filter((k) => averages.some((a) => a[0] !== k));
      right.keys = [...right.keys, ...averages.map((a) => a[0])];
    }
  }

  let chart = <></>;

  if (dateKey || measures.length > 1) {
    let labels: (string | Date | number)[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let datasets: ChartDataset<any>[];

    const options: ChartOptions<'bar'> = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        tooltip: {
          mode: 'index',
        },
        legend: {
          position: 'left',
        },
      },
      scales: {
        x: !dateKey
          ? {
              type: 'category',
            }
          : {
              type: 'time',
              ticks: {
                source: 'labels',
              },
              time: {
                unit: interval,
                tooltipFormat: 'MMMM, YYYY',
                displayFormats: {
                  month: 'M/YY',
                  week: 'MMM D',
                  year: 'YYYY',
                  quarter: "[Q]Q 'YY",
                },
              },
            },
      },
    };

    if (!dimensions.length) {
      options.scales.left = {
        type: 'linear',
        position: 'left',
      };
    }

    if (right) {
      options.scales['right'] = {
        type: 'linear',
        grid: {
          display: false,
        },
        position: 'right',
      };
    }

    if (measures.length === 1 && dimensions.length === 1) {
      options.scales.x.stacked = true;
      options.scales.y = { stacked: true };

      const intervals = resultSet.pivot({ x: [dateKey], y: [dimensions[0][0]] });

      labels = intervals.map((i) => tz(i.xValues[0] as string).toDate());

      const topDimensions = new Set<string>();

      for (const interval of intervals) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const total = interval.yValuesArray.reduce((prev, curr) => prev + parseFloat(curr[1] as any), 0);

        for (const [[dimension], amount] of interval.yValuesArray) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (parseFloat(amount as any) / total >= 0.05) {
            topDimensions.add(dimension);
          }
        }
      }

      const pivot = resultSet
        .pivot({ x: [dimensions[0][0]], y: [dateKey] })
        .filter((p) => p.xValues[0] !== null)
        .map((p) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const values = p.yValuesArray.map((d) => parseFloat(d[1] as any));

          return {
            label: `${p.xValues[0]}`,
            total: values.reduce((a, b) => a + b, 0),
            values,
          };
        });

      pivot.sort((a, b) => (a.total > b.total ? -1 : 1));

      const top = pivot.filter((p, index) => {
        if (topDimensions.size < colors.length) {
          return index < colors.length - 1;
        }

        return topDimensions.has(p.label);
      });

      if (top.length && top.length !== pivot.length) {
        const other = { label: 'Other', total: 0, values: top[0].values.map(() => 0) };

        for (const entry of pivot) {
          if (top.includes(entry)) {
            continue;
          }

          for (const index in entry.values) {
            other.total += entry.values[index];
            other.values[index] += entry.values[index];
          }
        }

        top.push(other);
      }

      top.sort((a, b) => (a.total > b.total ? -1 : 1));

      datasets = top.map(({ label, values }, index) => {
        const color = label === 'true' ? colorTrue : label === 'false' ? colorFalse : colors[index];

        return {
          label,
          data: values,
          backgroundColor: color,
          borderColor: color,
        };
      });
    } else {
      const totals = {};

      const rows: Row[] = resultSet.tablePivot().map((r) => {
        const data: Row = { date: dateKey ? tz(r[dateKey] as string).toDate() : undefined };

        for (const [key, config] of measures) {
          data[key] = parseFloat(r[key] as string);

          if (!totals[key]) {
            totals[key] = 0;
          }

          if (config['meta']?.average) {
            const arrayKey = `${key}_array`;

            if (!totals[arrayKey]) {
              totals[arrayKey] = [];
            }

            totals[arrayKey].push(data[key]);
          } else {
            totals[key] += data[key];
          }
        }

        for (const [dimension] of dimensions) {
          data[dimension] = r[dimension] as string;
        }

        return data;
      });

      for (const [key] of measures) {
        const arr = totals[`${key}_array`];

        if (arr) {
          totals[key] = arr.reduce((a, b) => a + b, 0) / arr.length;
        }
      }

      const top: Row[] = dateKey ? rows : [];
      let other: Row;
      const otherAverages: Record<string, number[]> = {};

      if (!dateKey) {
        rows: for (const row of rows) {
          for (const [key] of measures) {
            if (measures.length > 1 && totals[`${key}_array`]) {
              // do not use average for top calcuation if multiple measures exist since average can be uniform
              continue;
            }

            if ((row[key] as number) / totals[key] > 0.01) {
              top.push(row);
              continue rows;
            }
          }

          if (!other) {
            other = {};
          }

          for (const [key] of measures) {
            const arrayKey = `${key}_array`;

            if (!other[key]) {
              other[key] = 0;
            }

            if (totals[arrayKey]) {
              if (!otherAverages[key]) {
                otherAverages[key] = [];
              }

              otherAverages[key].push(row[key] as number);
            } else {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              other[key] += row[key];
            }
          }
        }

        for (const [key, values] of Object.entries(otherAverages)) {
          other[key] = values.reduce((a, b) => a + b, 0) / values.length;
        }
      }

      labels = top.map((d) => (dateKey ? d.date : d[dimensions[0][0]]));

      if (other) {
        labels.push('Other');
        top.push(other);
      }

      let colorIndex = 0;

      datasets = measures.map((m) => {
        const isLeft = left.keys.includes(m[0]);
        const color = colors[colorIndex];

        colorIndex += colorStep;

        if (colorIndex > colors.length - 1) {
          colorIndex = colorIndex - colors.length;
        }

        return {
          label: m[1].shortTitle,
          data: top.map((d) => d[m[0]]),
          backgroundColor: color,
          borderColor: color,
          hoverRadius: 10,
          hoverBorderWidth: 6,
          hoverBorderColor: '#ffffff',
          hoverBackgroundColor: color,
          type: isLeft ? 'bar' : 'line',
          yAxisID: isLeft ? 'left' : 'right',
          order: isLeft ? 1 : 0,
        };
      });
    }

    chart = (
      <Chart
        type="bar"
        options={options}
        data={{
          datasets,
          labels,
        }}
      />
    );
  } else {
    const pivot = resultSet.tablePivot();

    const top = pivot.slice(0, colors.length - 2);
    const other = pivot.slice(colors.length - 2);

    const labels = top.map((d) => `${d[dimensions[0][0]]}`);
    const data = top.map((d) => parseFloat(`${d[measures[0][0]]}`));

    if (other.length) {
      labels.push('Other');

      const otherTotal = other.reduce((prev, curr) => prev + parseFloat(`${curr[measures[0][0]]}`), 0);

      if (measures[0][1]['meta']?.average) {
        data.push(otherTotal / other.length);
      } else {
        data.push(otherTotal);
      }
    }

    let pieColors = colors;

    if (labels.length < colors.length / 2) {
      pieColors = [];
      const pieStep = Math.floor(colors.length / labels.length);

      for (let i = 0; i < labels.length; i += 1) {
        pieColors.push(colors[i * pieStep]);
      }
    }

    const dataset: ChartDataset<'pie'> = {
      label: measures[0][1].shortTitle,
      data,
      backgroundColor: pieColors,
      borderColor: pieColors,
      hoverBorderColor: pieColors.map(() => '#ffffff'),
      hoverBackgroundColor: pieColors,
      hoverOffset: 20,
      hoverBorderWidth: 3,
    };

    chart = (
      <Chart
        type="pie"
        options={{
          maintainAspectRatio: false,
          layout: {
            padding: {
              top: 20,
              bottom: 20,
            },
          },
          responsive: true,
          onClick(event, elements) {
            const query = resultSet.query();
            const timeDimension = dimensionMapping[query.dimensions[0]].times[0];

            scoped.merge({
              dimensions: [],
              timeDimensions: [{ dimension: timeDimension, granularity: 'month', dateRange: defaultReportRange() }],
              filters: [{ member: dimensions[0][0], operator: 'equals', values: [labels[elements[0].index]] }],
            });
          },
          plugins: {
            legend: {
              position: 'left',
            },
          },
        }}
        data={{
          datasets: [dataset],
          labels,
        }}
      />
    );
  }

  return (
    <Card>
      <div style={{ height: 500 }} className="relative w-full max-w-full">
        <div className="absolute top-0 left-0 right-0 bottom-0">{chart}</div>
      </div>
    </Card>
  );
};

const InnerChart = ({ state }: { state: State<Query> }) => {
  const scoped = useState(state);
  const { cubejsApi } = useContext(CubeContext);

  return (
    <QueryBuilder
      query={JSON.parse(JSON.stringify(scoped.get()))}
      disableHeuristics
      cubejsApi={cubejsApi}
      render={({ isQueryPresent, resultSet, measures, loadingState }) => {
        if (loadingState.isLoading || !isQueryPresent || measures.length === 0) {
          return (
            <div className="flex items-center justify-center" style={{ height: 500 }}>
              <div className="w-32 h-32">
                <Spinner />
              </div>
            </div>
          );
        }

        return <RenderChart resultSet={resultSet} state={scoped} />;
      }}
    />
  );
};

export default function VendorReportPage() {
  const initialQuery = {
    ...emptyQuery,
    ...queries[PremadeVendorReport.SERVICE_REVENUE].query,
    timezone: getTimezone(),
  };

  // show last year of data by default
  initialQuery.timeDimensions[0].dateRange = defaultReportRange();

  const state = useState<Query>(initialQuery);

  return (
    <Center padding>
      <div className="space-y">
        <VendorReportBar state={state} />
        <InnerChart state={state} />
      </div>
    </Center>
  );
}
