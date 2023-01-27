import { none, State, StateMethods } from '@hookstate/core';
import OrderRequestedSlidebar from 'client/global/components/model/OrderRequestedSlidebar';
import Requested from 'client/global/components/Requested';
import Selectable from 'client/global/components/tailwind/Selectable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { BuyerCreateOrderRequested } from 'client/portal/buyer/order/BuyerCreateOrderState';
import { ConditionType, RuleContextAccessor } from 'common/rules/Condition';
import { buildConditionTree, validateConditionTree } from 'common/rules/Rule';
import dayjs from 'dayjs';
import * as React from 'react';
import { OrderRuleStateContext } from 'shared/components/fields/OrderRuleContext';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import { BuyerCreateOrderScheduleQuery } from 'shared/generated';
import DeleteIcon from 'shared/icons/DeleteIcon';

export default function BuyerOrderTimePreferencesPicker({
  requested,
  orderRuleContext,
  specific,
  query,
}: {
  requested: State<BuyerCreateOrderRequested[]>;
  orderRuleContext: OrderRuleStateContext;
  specific: StateMethods<boolean>;
  query: BuyerCreateOrderScheduleQuery;
}) {
  return (
    <div className="space-y mt">
      {!query.vendor.requireRequestTimes && (
        <>
          <Selectable
            title="No Preference"
            checked={!specific.get()}
            onClick={() => {
              requested.set([]);

              specific.set(false);
            }}
          >
            We will choose a date and time that minimizes your cost while ensuring the fastest order completion.
          </Selectable>

          <Selectable title="Specific Dates" checked={specific.get()} onClick={() => specific.set(true)}>
            Provide a list of dates and times that work best with your schedule.
          </Selectable>
        </>
      )}
      {specific.get() && (
        <div>
          <div className="flex justify-end mb">
            <OrderRequestedSlidebar state={requested} />
          </div>
          <Table round border>
            <TableHead>
              <TableRow>
                <TableHeadCell>Date/Time</TableHeadCell>
                <TableHeadCell></TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requested.map((requested) => {
                const start = requested.start.get() ? new Date(requested.start.get()) : null;
                const end = requested.end.get() ? new Date(requested.end.get()) : null;

                // detect if any rules depend on appointment time
                const appointmentRules = query.vendor.rules.filter(
                  (r) =>
                    r.conditions.some((c) =>
                      [
                        ConditionType.APPOINTMENT_TIME,
                        ConditionType.APPOINTMENT_DOW,
                        ConditionType.ORDER_REQUESTED_DOW,
                        ConditionType.ORDER_REQUESTED_TIME,
                      ].includes(c.type)
                    ) &&
                    r.actions.some((a) => a.__typename === 'ActionJobRevenue' || a.__typename === 'ActionOrderRevenue')
                );

                const hasRule = appointmentRules.some((rule) => {
                  // filter out conditions that we cannot evaluate yet
                  const conditions = rule.conditions.filter(
                    (c) =>
                      ![
                        ConditionType.ORDER_PERFORMABLE,
                        ConditionType.ORDER_FIELD,
                        ConditionType.PERFORMABLE,
                        ConditionType.ORDER_SOURCE,
                      ].includes(c.type)
                  );

                  const tree = buildConditionTree(conditions);

                  const valid = validateConditionTree(
                    new RuleContextAccessor({
                      ...orderRuleContext,
                      appointment: {
                        start: start || end,
                        end: end || start,
                        holidays: query.holidays
                          .filter((h) => dayjs(start || end).isSame(h.date, 'day'))
                          .map((h) => h.id),
                        timezone: orderRuleContext.order.timezone,
                        address: orderRuleContext.order.address,
                      },
                    }),
                    // TODO: why does typescript complain about tree?
                    tree as never
                  );

                  return valid;
                });

                return (
                  <TableRow key={`${requested.start.get()}-${requested.end.get()}`}>
                    <TableCell className="w-full">
                      <Requested start={requested.start.get()} end={requested.end.get()} />

                      {hasRule && (
                        <Message type={MessageType.WARNING} round className="mt-2">
                          Additional fees may apply for this date and/or time.
                        </Message>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        style={ButtonStyle.DANGER}
                        slim
                        icon={<DeleteIcon />}
                        onClick={() => requested.set(none)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
