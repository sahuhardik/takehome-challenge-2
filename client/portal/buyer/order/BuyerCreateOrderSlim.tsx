import { State, useState } from '@hookstate/core';
import Selectable from 'client/global/components/tailwind/Selectable';
import SpinnerLoader from 'client/global/components/tailwind/SpinnerLoader';
import useGetCurrentBuyerRelId from 'client/global/hooks/useCurrentBuyer';
import { OrderButton, OrderContent, OrderHeading, OrderParagraph } from 'client/portal/buyer/BuyerLayout';
import {
  BuyerCreateOrderState,
  useBuyerOrderCreateStateContext,
} from 'client/portal/buyer/order/BuyerCreateOrderState';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderRuleStateContext } from 'shared/components/fields/OrderRuleContext';
import { OrderRuleStateCost } from 'shared/components/fields/OrderRuleStateCost';
import { PerformableFormType } from 'shared/components/fields/PerformableConfigureForm';
import ServiceConfigureForm from 'shared/components/fields/ServiceConfigureForm';
import useServiceFormRevenue from 'shared/components/fields/UseServiceFormRevenue';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import {
  BuyerCreateOrderSlimDocument,
  BuyerCreateOrderSlimQuery,
  BuyerCreateOrderVendorFragment,
  OrderCreateService,
} from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import Money from 'shared/utilities/Money';
import { ValidationAttach } from 'shared/utilities/Validation';
import v4 from 'uuid/v4';

function ServiceLines({
  serviceId,
  state,
  context,
}: {
  state: State<BuyerCreateOrderState>;
  serviceId: string;
  context: OrderRuleStateContext;
}) {
  const scope = useState(state);
  const serviceState = scope.services.find((s) => s.serviceId.get() === serviceId).fields;

  const pricing = useServiceFormRevenue(context.vendorMemberId, context, serviceId, serviceState);

  const lines = pricing.lines.filter((l) => l.revenue.abs().gt(0));

  // TODO: create style only FormHorizontal
  const dummy = useState(false);
  ValidationAttach(dummy);

  if (!lines.length) {
    return <></>;
  }

  return (
    <FormGroup plain className="my-4 sm:pl">
      {lines.map((l) => (
        <FormHorizontal state={dummy} name={l.name} key={l.actionId} first={false}>
          <Money>{l.revenue.toFixed(2)}</Money>
        </FormHorizontal>
      ))}
    </FormGroup>
  );
}

function ServiceForm({
  serviceId,
  state,
  context,
}: {
  state: State<BuyerCreateOrderState>;
  serviceId: string;
  context: OrderRuleStateContext;
}) {
  const scope = useState(state);
  const serviceState = scope.services.find((s) => s.serviceId.get() === serviceId).fields;

  return (
    <FormGroup plain className="mt sm:pl">
      <SpinnerLoader>
        <ServiceConfigureForm
          context={context}
          type={PerformableFormType.BUYER}
          state={serviceState}
          serviceId={serviceId}
        />
      </SpinnerLoader>
    </FormGroup>
  );
}

function Service({
  service,
  context,
  state,
}: {
  context: OrderRuleStateContext;
  state: State<BuyerCreateOrderState>;
  service: BuyerCreateOrderSlimQuery['cartServices'][0];
}) {
  const scope = useState(state);
  const checked = useState(scope.preselected.get().includes(service.id));

  const title = (
    <div>
      <div className="flex justify-between items-center">
        <div>{service.marketing.name}</div>

        <div>
          {checked.get() && (
            <OrderRuleStateCost
              fieldValuesState={scope.services.find((s) => s.serviceId.get() === service.id).fields}
              serviceId={service.id}
              context={context}
            />
          )}
        </div>
      </div>
      {!!service.marketing.slimDescription && (
        <p className="text-gray-600 text-sm font-normal">{service.marketing.slimDescription}</p>
      )}
    </div>
  );

  return (
    <Selectable
      key={service.id}
      capture={false}
      title={title}
      checked={checked.get()}
      onClick={() => {
        if (checked.get()) {
          checked.set(false);

          scope.set((s) => ({
            ...s,
            services: s.services.filter((s) => s.serviceId !== service.id),
          }));
        } else {
          scope.set((s) => ({
            ...s,
            services: [
              ...s.services,
              {
                id: v4(),
                serviceId: service.id,
                fields: service.properties.map((p) => ({ fieldId: p.id })),
              } as OrderCreateService,
            ],
          }));

          checked.set(true);
        }
      }}
    >
      {checked.get() && (
        <>
          <ServiceForm serviceId={service.id} state={state} context={context} />
          <React.Suspense fallback={<></>}>
            <ServiceLines serviceId={service.id} context={context} state={state} />
          </React.Suspense>
        </>
      )}
    </Selectable>
  );
}

export default function BuyerCreateOrderSlim({
  state,
  vendor,
  updateOrder,
}: {
  state: State<BuyerCreateOrderState>;
  vendor: BuyerCreateOrderVendorFragment;
  updateOrder: (service?: OrderCreateService) => Promise<void>;
}) {
  const buyerRelId = useGetCurrentBuyerRelId();
  const navigate = useNavigate();
  const scope = useState(state);

  const context = useBuyerOrderCreateStateContext(scope);

  const { cartServices } = useQueryHook(
    BuyerCreateOrderSlimDocument,
    { vendorId: vendor.id, buyerRelId },
    'cache-and-network'
  );

  const preselected = scope.preselected.get();

  const sorted = cartServices.sort((a, b) => {
    const aOrder = preselected.includes(a.id) ? -Infinity : a.sortOrder;
    const bOrder = preselected.includes(b.id) ? -Infinity : b.sortOrder;
    return aOrder - bOrder || a.marketing.name.localeCompare(b.marketing.name);
  });

  const grouped = new Map<string, typeof sorted>();

  for (const service of sorted) {
    const group = service.grouping || '';

    if (!grouped.has(group)) {
      grouped.set(group, []);
    }

    grouped.get(group).push(service);
  }

  return (
    <OrderContent>
      <OrderHeading caption="Welcome back! What are you interested in?" title="Select Services" />

      <OrderParagraph>Please select and configure at least one of the following services.</OrderParagraph>

      <div className="mt space-y">
        {Array.from(grouped.entries()).map(([group, services]) => (
          <div key={group}>
            {grouped.size > 1 && group && <div className="text-xl font-medium mb-2 theme-primary">{group}</div>}
            <div className="space-y">
              {services.map((service) => (
                <Service service={service} state={state} key={service.id} context={context} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {scope.services.length > 0 && (
        <OrderButton
          onButton={async () => {
            await updateOrder();

            navigate('../review');
          }}
          disabled={scope.services}
          button="Continue to Checkout"
        />
      )}
    </OrderContent>
  );
}
