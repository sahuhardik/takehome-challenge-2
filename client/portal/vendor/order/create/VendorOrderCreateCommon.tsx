import { State, useState } from '@hookstate/core';
import { OrderSource, TimeZone } from 'common/enums';
import { RuleContextFieldType } from 'common/rules/RuleContext';
import dayjs from 'dayjs';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { buyerRuleContext, OrderRuleStateContext, vendorRuleContext } from 'shared/components/fields/OrderRuleContext';
import { OrderRuleStateCost } from 'shared/components/fields/OrderRuleStateCost';
import { FieldValueWrite, OrderCreate, VendorOrderCreateCommonDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

export type OrderCreateState = Omit<OrderCreate, 'metadata'> & {
  details: boolean;
  vendorId: string;
  orderId?: string;
  versionId?: number;
  scheduled: boolean;
};

export function useOrderCreateStateContext(
  orderState: State<OrderCreateState>,
  fieldState: State<FieldValueWrite[]>
): OrderRuleStateContext {
  const orderScope = useState(orderState);
  const fieldScope = useState(fieldState);
  const { vendorId } = useParams();

  const buyerRelId = orderScope.buyer.get().id;

  const { vendor, holidays, buyer } = useQueryHook(VendorOrderCreateCommonDocument, { vendorId, buyerRelId });

  const date = new Date();

  return {
    ...vendorRuleContext(vendor),
    buyers: buyerRuleContext(buyer),
    order: {
      date,
      source: OrderSource.VENDOR,
      requested: orderScope.requested.get().map((r) => ({
        start: dayjs(r.start).toDate(),
        end: dayjs(r.end).toDate(),
        timezone: vendor.timezoneDisplay as TimeZone,
        holidays: holidays.filter((h) => dayjs(h.date).isSame(r.start, 'day')).map((h) => h.id),
      })),
      timezone: vendor.timezoneDisplay as TimeZone,
      holidays: holidays.filter((h) => dayjs(h.date).isSame(date, 'day')).map((h) => h.id),
      address: orderScope.address.get(),
      fields: fieldScope.map((fieldState) => ({
        type: vendor.fields
          .find((field) => field.id === fieldState.fieldId.get())
          .fieldType.toLowerCase() as RuleContextFieldType,
        fieldId: fieldState.fieldId.get(),
        booleanValue: fieldState.booleanValue.get(),
        textValue: fieldState.textValue.get(),
        numberValue: fieldState.numberValue.get(),
      })),
      performables: orderScope.services.map((s) => ({
        performableId: s.serviceId.get(),
        fields: s.fields.map((f) => ({
          fieldId: f.fieldId.get(),
          textValue: f.textValue.get(),
          booleanValue: f.booleanValue.get(),
          numberValue: f.numberValue.get(),
        })),
      })),
    },
  };
}

export function ServiceCostHeading({
  context,
  serviceId,
  fieldValuesState,
  serviceName,
}: {
  context: OrderRuleStateContext;
  serviceId: string;
  fieldValuesState: State<FieldValueWrite[]>;
  serviceName: string;
}) {
  const clearMargin = ['-mt-6', '-mx-4', 'sm:-mx-6', 'sm:-mt-6'];
  const padding = ['px-4 sm:px-6', 'py-3 sm:py-4'];
  const styles = ['border-b-2', 'border-theme-primary', 'text-lg', 'leading-6', 'font-medium', 'text-gray-900'];
  const display = ['flex'];

  const classes = [...clearMargin, ...padding, ...styles, ...display];
  return (
    <div className={classes.join(' ')}>
      <h3 className="flex-1">{serviceName}</h3>
      <div className="flex-grow-0">
        <OrderRuleStateCost fieldValuesState={fieldValuesState} serviceId={serviceId} context={context} />
      </div>
    </div>
  );
}
