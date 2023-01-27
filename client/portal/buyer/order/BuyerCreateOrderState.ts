import { State, useState } from '@hookstate/core';
import useGetCurrentBuyerRelId from 'client/global/hooks/useCurrentBuyer';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import {
  FieldType,
  OrderSource as CommonOrderSource,
  OrderSource,
  PerformablePricingType,
  RuleAdjustment,
  TimeZone,
} from 'common/enums';
import { ContextAccessor } from 'common/rules/Condition';
import { MemberPerformableOverride } from 'common/rules/PricingEngine';
import { RuleContextFieldType } from 'common/rules/RuleContext';
import dayjs from 'dayjs';
import { buyerRuleContext, OrderRuleStateContext } from 'shared/components/fields/OrderRuleContext';
import {
  Address,
  BuyerCreateOrderStateDocument,
  BuyerCreateOrderStateQuery,
  BuyerCreateOrderVendorFragment,
  FieldValueWrite,
  OrderCreateService,
  OrderRuleContextBuyerNestedFragment,
  UserExists,
} from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

export interface BuyerCreateOrderRequested {
  start: string;
  end: string;
}

export interface BuyerCreateOrderState {
  exists?: UserExists;
  address?: Address;
  buyerId?: string;
  orderId?: string;
  versionId: number;
  sawFields: boolean;
  permission?: boolean;
  lat?: number;
  lng?: number;
  terms: boolean;
  cart?: boolean;
  fields: FieldValueWrite[];
  sources: string[];
  preselected: string[];
  requested: BuyerCreateOrderRequested[];
  services: (OrderCreateService & { packagePerformableId?: string })[];
}

export function buyerOrderStateToAppointment(vendor: { timezoneDisplay: string }, state: State<BuyerCreateOrderState>) {
  const requested = state.requested.get();
  let earliest: BuyerCreateOrderRequested;

  for (const req of requested) {
    if (!earliest || req.start < earliest.start) {
      earliest = req;
    }
  }

  return earliest
    ? {
        start: new Date(earliest.start),
        end: new Date(earliest.end),
        address: state.address.get(),
        holidays: [],
        timezone: vendor.timezoneDisplay as TimeZone,
      }
    : null;
}

function createBuyerOrderCreateStateContext(
  { vendor, holidays, buyer }: BuyerCreateOrderStateQuery,
  state: State<BuyerCreateOrderState>
): OrderRuleStateContext {
  const date = new Date();

  return {
    buyers: buyerRuleContext(buyer),
    vendorMemberId: vendor.id,
    appointment: null,
    providers: vendor.providers.map((provider) => ({
      id: provider.id,
      performables: provider.performables.map((performable) => {
        const fields: MemberPerformableOverride[] = [];
        const fieldOptions: MemberPerformableOverride[] = [];

        for (const property of performable.properties) {
          if (property.propertyValueId) {
            fieldOptions.push({
              id: property.propertyValueId,
              adjustment: property.overrideType.toLowerCase() as RuleAdjustment,
            });
          } else {
            fields.push({
              id: property.propertyId,
              adjustment: property.overrideType.toLowerCase() as RuleAdjustment,
            });
          }
        }

        return {
          id: performable.performableId,
          adjustment: performable.overrideType.toLowerCase() as RuleAdjustment,
          fields,
          fieldOptions,
        };
      }),
    })),
    performables: vendor.services.map((service) => ({
      id: service.id,
      onsite: service.onsite,
      revenue: service.revenue,
      expenseType: PerformablePricingType.FLAT, // doesn't matter at order creation
      onsiteAdjustment: service.revenueType?.toLowerCase() as RuleAdjustment,
      revenueAdjustment: service.revenueType?.toLowerCase() as RuleAdjustment,
      fields: service.properties.map((property) => ({
        id: property.id,
        type: property.fieldType.toLowerCase() as FieldType,
        onsiteAdjustment: property.onsiteType?.toLowerCase() as RuleAdjustment,
        revenueAdjustment: property.revenueType?.toLowerCase() as RuleAdjustment,
        onsite: property.onsite,
        revenue: property.revenue,
        tiers: property.tiers,
        quantity: property.quantity,
        options: property.values.map((value) => ({
          id: value.id,
          onsite: value.onsite,
          quantity: value.quantity,
          revenue: value.revenue,
        })),
      })),
      variants: service.variants.map((variant) => ({
        revenue: variant.revenue,
        fieldOptionIds: variant.values.map((v) => v.value),
      })),
    })),
    order: {
      date,
      source: OrderSource.BUYER,
      requested: state.requested.get().map((r) => ({
        start: dayjs(r.start).toDate(),
        end: dayjs(r.end).toDate(),
        timezone: vendor.timezoneDisplay as TimeZone,
        holidays: holidays.filter((h) => dayjs(h.date).isSame(r.start, 'day')).map((h) => h.id),
      })),
      address: state.address.get(),
      holidays: holidays.filter((h) => dayjs(h.date).isSame(date, 'day')).map((h) => h.id),
      timezone: vendor.timezoneDisplay as TimeZone,
      fields: state.fields.map((fieldState) => ({
        type: vendor.fields
          .find((field) => field.id === fieldState.fieldId.get())
          .fieldType.toLowerCase() as RuleContextFieldType,
        fieldId: fieldState.fieldId.get(),
        booleanValue: fieldState.booleanValue.get(),
        textValue: fieldState.textValue.get(),
        numberValue: fieldState.numberValue.get(),
      })),
      performables: state.services.map((s) => ({
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

export function useBuyerOrderCreateStateContext(state: State<BuyerCreateOrderState>): OrderRuleStateContext {
  const scope = useState(state);

  const vendorId = useCurrentVendorId();
  const buyerId = useGetCurrentBuyerRelId();

  const query = useQueryHook(BuyerCreateOrderStateDocument, { vendorId, buyerId });

  return createBuyerOrderCreateStateContext(query, scope);
}

export class BuyerOrderContextAccessor implements ContextAccessor {
  private date = new Date();
  private buyers: OrderRuleStateContext['buyers'];
  private holidayIds: string[];

  constructor(
    private state: State<BuyerCreateOrderState>,
    private vendor: BuyerCreateOrderVendorFragment,
    private holidays: { id: string; name: string; date: string }[],
    buyer: OrderRuleContextBuyerNestedFragment
  ) {
    this.buyers = buyerRuleContext(buyer);
    this.holidayIds = holidays.filter((h) => dayjs(h.date).isSame(this.date, 'day')).map((h) => h.id);
  }

  providerMemberId(): string | null {
    return null;
  }

  orderSource() {
    return CommonOrderSource.BUYER;
  }

  orderRequestedDow() {
    const requested = this.state.requested.get();

    return requested.map((r) => ({
      start: dayjs(r.start).toDate(),
      end: dayjs(r.end).toDate(),
      timezone: this.vendor.timezoneDisplay as TimeZone,
      holidays: this.holidays.filter((h) => dayjs(r.start).isSame(h.date, 'day')).map((h) => h.id),
    }));
  }

  orderRequestedTime() {
    return this.orderRequestedDow();
  }

  appointmentDow() {
    return null;
  }

  appointmentPostal() {
    // TODO: force rules to use an ORDER_ADDRESS condition
    return this.state.address.postalCode.get();
  }

  appointmentTime() {
    return null;
  }

  buyerField() {
    return this.buyers;
  }

  orderBuyer() {
    return this.buyers.map((b) => b.buyerId);
  }

  orderDow() {
    return { date: this.date, holidays: this.holidayIds };
  }

  orderField() {
    return {
      timezone: this.vendor.timezoneDisplay as TimeZone,
      fields: this.state.fields.map((fieldState) => ({
        type: this.vendor.fields
          .find((field) => field.id === fieldState.fieldId.get())
          .type.toLowerCase() as RuleContextFieldType,
        fieldId: fieldState.fieldId.get(),
        booleanValue: fieldState.booleanValue.get(),
        textValue: fieldState.textValue.get(),
        numberValue: fieldState.numberValue.get(),
      })),
    };
  }

  orderPerformable() {
    return {
      performables: this.state.services.map((s) => ({
        performableId: s.serviceId.get(),
        fields: s.fields.map((f) => ({
          fieldId: f.fieldId.get(),
          textValue: f.textValue.get(),
          booleanValue: f.booleanValue.get(),
          numberValue: f.numberValue.get(),
        })),
      })),
    };
  }

  orderTime() {
    return { date: this.date, timezone: this.vendor.timezoneDisplay as TimeZone };
  }

  performable() {
    return null;
  }
}
