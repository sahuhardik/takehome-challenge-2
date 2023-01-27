import { useState } from '@hookstate/core';
import FormDate from 'client/global/components/form/FormDate';
import Card from 'client/global/components/tailwind/Card';
import Center from 'client/global/components/tailwind/Center';
import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { updateQuery } from 'client/global/NavigationUtil';
import dayjs from 'dayjs';
import { parse } from 'query-string';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  VendorAccountingCreatePayoutDocument,
  VendorAccountingPayoutsDocument,
  VendorProvidersDocument,
  VendorUnpaidDocument,
  VendorUnpaidQuery,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import Money from 'shared/utilities/Money';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

function Range({ start, end, back }: { start: Date; end: Date; back: () => void }) {
  const { vendorId } = useParams();

  const {
    vendor: { unpaid },
  } = useQueryHook(
    VendorUnpaidDocument,
    { vendorId, start: start.toISOString(), end: end.toISOString() },
    'cache-and-network'
  );

  const create = useMutationPromise(VendorAccountingCreatePayoutDocument);

  const vendorProviders = useQueryHook(VendorProvidersDocument, { vendorId });

  const providers: {
    id: string;
    name: string;
    total: number;
    orders: Record<string, { address: string; date: Date; ledger: VendorUnpaidQuery['vendor']['unpaid'] }>;
  }[] = [];

  for (const item of unpaid) {
    let provider = providers.find((p) => p.id === item.memberId);

    if (!provider) {
      provider = {
        id: item.memberId,
        name: vendorProviders.vendor.providers.find((p) => p.member.id === item.memberId)?.member.company,
        total: 0,
        orders: {},
      };

      providers.push(provider);
    }

    let ledger = provider.orders[item.line.invoice.order?.id]?.ledger;

    if (!ledger) {
      ledger = [];

      provider.orders[item.line.invoice.order?.id] = {
        address: item.line.invoice.order?.address.addressFirst,
        date: new Date(item.job?.start),
        ledger,
      };
    }

    ledger.push(item);
    provider.orders[item.line.invoice.order?.id].ledger = ledger.sort((a, b) => (a.job?.start > b.job?.start ? 1 : -1));

    provider.total += parseFloat(item.amount);
  }

  if (providers.length === 0) {
    return (
      <Center padding className="space-y">
        <Card>There are no ledgers in the time range you specified or they have all been included in a payout.</Card>

        <Button onClick={() => back()} style={ButtonStyle.SECONDARY}>
          Go Back
        </Button>
      </Center>
    );
  }

  return (
    <div className="space-y">
      {providers.map((provider) => (
        <Card key={provider.id}>
          {provider.name}:{' '}
          <span className="text-green-600 font-semibold">
            <Money>{provider.total}</Money>
          </span>
          <Table round border className="mt">
            <TableHead>
              <TableRow>
                <TableHeadCell>Order</TableHeadCell>
                <TableHeadCell>Date</TableHeadCell>
                <TableHeadCell>Entry</TableHeadCell>
                <TableHeadCell>IDs</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(provider.orders)
                .sort(([, a], [, b]) => (a.ledger[0].job?.start > b.ledger[0].job?.start ? 1 : -1))
                .map(([, order]) =>
                  order.ledger.map((ledger, index) => (
                    <TableRow key={ledger.id}>
                      {index === 0 && (
                        <TableCell rowSpan={order.ledger.length}>
                          {ledger.line.invoice.order?.id ? (
                            <Link
                              to={`/ui/vendor/${vendorId}/order/view/${ledger.line.invoice.order.id}/`}
                              style={LinkStyle.BOLD}
                            >
                              #{order.address}
                            </Link>
                          ) : (
                            'No Order'
                          )}
                          <div key={ledger.line.invoice.buyer.member.id}>
                            {ledger.line.invoice.buyer.member.company}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <strong>Ledger:</strong> {dayjs(ledger.date).format('MM/DD h:mm A')}
                        <br />
                        <strong>Scheduled:</strong> {ledger.job && dayjs(ledger.job.start).format('MM/DD h:mm A')}
                      </TableCell>
                      <TableCell>
                        <div
                          className={`font-semibold ${
                            parseFloat(ledger.amount) > 0 ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          <Money>{ledger.amount}</Money>
                        </div>
                        <div className="break-words max-w-sm">{ledger.description}</div>
                      </TableCell>
                      <TableCell>
                        {ledger.job && (
                          <div>
                            <strong>Source: </strong>

                            <Link to={`/ui/vendor/${vendorId}/order/view/${ledger.job.orderId}/jobs/${ledger.job.id}`}>
                              #{ledger.job.id}
                            </Link>
                          </div>
                        )}
                        <strong>Ledger:</strong> #{ledger.id}
                      </TableCell>
                    </TableRow>
                  ))
                )}
            </TableBody>
          </Table>
        </Card>
      ))}
      <Button onClick={() => back()} style={ButtonStyle.SECONDARY}>
        Go Back
      </Button>
      <PromiseButton
        onClick={async () => {
          await create({ vendorId, start: start.toISOString(), end: end.toISOString() });

          back();
        }}
      >
        Create Payout
      </PromiseButton>
    </div>
  );
}

function Payouts() {
  const { vendorId } = useParams();
  const query = useQueryHook(VendorAccountingPayoutsDocument, { vendorId });

  if (!query.vendor.payouts.length) {
    return <Card>No payouts have been issued.</Card>;
  }

  return (
    <Table card>
      <TableHead>
        <TableRow>
          <TableHeadCell>Provider</TableHeadCell>
          <TableHeadCell>Start</TableHeadCell>
          <TableHeadCell>End</TableHeadCell>
          <TableHeadCell>Amount</TableHeadCell>
          <TableHeadCell>MTD</TableHeadCell>
          <TableHeadCell>YTD</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {query.vendor.payouts.map((payout) => (
          <TableRow key={payout.id}>
            <TableCell>{payout.provider.member.company}</TableCell>
            <TableCell>{dayjs(payout.start).format('MM/DD')}</TableCell>
            <TableCell>{dayjs(payout.end).format('MM/DD')}</TableCell>
            <TableCell>
              <Money>{payout.amount}</Money>
            </TableCell>
            <TableCell>
              <Money>{payout.monthToDate}</Money>
            </TableCell>
            <TableCell>
              <Money>{payout.yearToDate}</Money>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function VendorAccountingPayouts() {
  const parsed = parse(window.location.search);

  const state = useState({
    start: (parsed.start
      ? dayjs(parsed.start as string)
          .startOf('day')
          .toDate()
          .getTime()
      : dayjs().subtract(7, 'day').toDate().getTime()) as number,
    end: (parsed.start
      ? dayjs(parsed.end as string)
          .endOf('day')
          .toDate()
          .getTime()
      : Date.now()) as number,
    submit: !!parsed.start,
  });

  ValidationAttach(state, (validator) => {
    validator.start.required();
    validator.end.required();
  });

  if (state.submit.get()) {
    return (
      <Range
        start={dayjs(state.start.get()).startOf('day').toDate()}
        end={dayjs(state.end.get()).endOf('day').toDate()}
        back={() => {
          state.submit.set(false);
        }}
      />
    );
  }

  return (
    <Center small>
      <FormGroup>
        <FormHorizontal state={state.start} name="Scheduled Start">
          <FormDate state={state.start} />
        </FormHorizontal>
        <FormHorizontal state={state.end} name="End Start">
          <FormDate state={state.end} />
        </FormHorizontal>
      </FormGroup>
      <Button
        disabled={!Validation(state).valid(true)}
        onClick={() => {
          updateQuery({
            start: dayjs(state.start.get()).format('YYYY-MM-DD'),
            end: dayjs(state.end.get()).format('YYYY-MM-DD'),
          });
          state.submit.set(true);
        }}
      >
        Calculate
      </Button>
      <div className="mt">
        <Payouts />
      </div>
    </Center>
  );
}
