import { State } from '@hookstate/core';
import { OrderButton, OrderMarketing } from 'client/portal/buyer/BuyerLayout';
import { BuyerCreateOrderState } from 'client/portal/buyer/order/BuyerCreateOrderState';
import * as React from 'react';
import { filterSelectFieldOption } from 'shared/components/fields/FieldsConfigureForm';
import { OrderRuleStateContext } from 'shared/components/fields/OrderRuleContext';
import useServiceFormRevenue from 'shared/components/fields/UseServiceFormRevenue';
import { FieldType, FieldValueWrite, ShopAddOnDocument, ShopWizardFragment } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import { useMoney } from 'shared/utilities/Money';

export default function BuyerCreateOrderAddOn({
  state,
  page,
  context,
  onContinue,
}: {
  state: State<BuyerCreateOrderState>;
  context: OrderRuleStateContext;
  page: ShopWizardFragment['pages'][0];
  onContinue: () => void | Promise<void>;
}) {
  const { performableProperty: property } = useQueryHook(
    ShopAddOnDocument,
    { propertyId: page.propertyId },
    'cache-and-network'
  );

  const money = useMoney();

  const serviceState = state.services.find((s) => s.serviceId.get() === page.performableId);

  const disabledAmount = useServiceFormRevenue(
    context.vendorMemberId,
    context,
    page.performableId,
    serviceState.fields
  ).revenue.toFixed(2);

  const override: FieldValueWrite = {
    fieldId: page.propertyId,
    booleanValue: property.fieldType === FieldType.Boolean,
  };

  switch (property.fieldType) {
    case FieldType.Boolean:
      override.booleanValue = true;
      break;
    case FieldType.Select: {
      const values = property.values.filter((v) => filterSelectFieldOption(context, v.conditions));

      if (values.length === 1) {
        override.textValue = values[0].id;

        break;
      }

      throw new Error(`Performable property ${property.id} must have only one select value.`);
    }
    default:
      throw new Error(`Field type: ${property.fieldType} unsupported for upsell add-on.`);
  }

  const enabledAmount = useServiceFormRevenue(
    context.vendorMemberId,
    context,
    page.performableId,
    serviceState.fields,
    override
  ).revenue.toFixed(2);

  const enableAddOn = () => {
    const serviceProperty = serviceState.fields.find((p) => p.fieldId.get() === page.propertyId);

    serviceProperty.merge(override);

    onContinue();
  };

  return (
    <OrderMarketing marketing={property.marketing} caption={page.caption}>
      <OrderButton
        onButton={enableAddOn}
        button={`Add for ${money(parseFloat(enabledAmount) - parseFloat(disabledAmount))}`}
        link="I am not interested in this add-on"
        onLink={onContinue}
      />
    </OrderMarketing>
  );
}
