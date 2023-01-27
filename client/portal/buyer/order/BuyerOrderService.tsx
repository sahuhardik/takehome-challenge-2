import { State, useState } from '@hookstate/core';
import Selectable from 'client/global/components/tailwind/Selectable';
import SpinnerLoader from 'client/global/components/tailwind/SpinnerLoader';
import { OrderButton, OrderMarketing } from 'client/portal/buyer/BuyerLayout';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { useJobConfigureState } from 'shared/components/fields/JobConfigureForm';
import { OrderRuleStateContext } from 'shared/components/fields/OrderRuleContext';
import { PerformableFormType, usePerformableConfigureState } from 'shared/components/fields/PerformableConfigureForm';
import ServiceConfigureForm from 'shared/components/fields/ServiceConfigureForm';
import useServiceFormRevenue from 'shared/components/fields/UseServiceFormRevenue';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import { FieldType, FieldValueWrite, OrderCreateService, ShopServiceDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import Money, { useMoney } from 'shared/utilities/Money';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';
import { v4 } from 'uuid';

interface BuyerCreateOrderServiceProps {
  configure?: boolean;
  caption?: string;
  serviceId: string;
  id?: string;
  versionId?: number;
  context: OrderRuleStateContext;
  onContinue: (service?: OrderCreateService) => Promise<void>;
}

function ServiceLines({
  serviceId,
  state,
  context,
}: {
  state: State<FieldValueWrite[]>;
  serviceId: string;
  context: OrderRuleStateContext;
}) {
  const pricing = useServiceFormRevenue(context.vendorMemberId, context, serviceId, state);

  const lines = pricing.lines.filter((l) => l.revenue.abs().gt(0));

  // TODO: create style only FormHorizontal
  const dummy = useState(false);
  ValidationAttach(dummy);

  if (!lines.length) {
    return <></>;
  }

  return (
    <>
      {lines.map((l) => (
        <FormHorizontal state={dummy} name={l.name} key={l.actionId} first={false}>
          <Money>{l.revenue.toFixed(2)}</Money>
        </FormHorizontal>
      ))}
    </>
  );
}

function ServiceForm({
  serviceId,
  context,
  onContinue,
  id,
  versionId,
  serviceState,
}: Pick<BuyerCreateOrderServiceProps, 'serviceId' | 'context' | 'onContinue' | 'id' | 'versionId'> & {
  serviceState: State<FieldValueWrite[]>;
}) {
  const scoped = useState(serviceState);
  const money = useMoney();
  const { service } = useQueryHook(ShopServiceDocument, { serviceId });
  const amount = useServiceFormRevenue(context.vendorMemberId, context, serviceId, scoped).revenue.toFixed(2);

  const add = useState(false);

  const addService = () => {
    return onContinue({
      id: id || v4(),
      versionId,
      serviceId: service.id,
      fields: scoped.get(),
    });
  };

  const isAdd = add.get();

  useEffect(() => {
    if (isAdd) {
      document.getElementById('configure').scrollIntoView();
    }
  }, [isAdd]);

  const addons = [];

  const showAddon = useRef(false);

  for (const property of service.properties) {
    const propertyState = scoped.find((p) => p.fieldId.get() === property.id);

    if (property.fieldType === FieldType.Boolean && property.revenue) {
      const checked = !!propertyState.booleanValue.get();

      const title = (
        <div className="flex items-center justify-between">
          <div className="flex-1">{property.marketing.name}</div>
          <span className="text-gray-500 text-sm font-semibold">
            +<Money>{property.revenue}</Money>
          </span>
        </div>
      );

      addons.push(
        <Selectable
          title={title}
          checked={checked}
          onClick={() => propertyState.booleanValue.set(!checked)}
          key={property.id}
        >
          {property.marketing.description}
        </Selectable>
      );
    } else if (Validation(scoped).valid(true)) {
      showAddon.current = true;
    }
  }

  return (
    <div id="configure" className="pt">
      {/*{!!service.marketing.slimDescription && (*/}
      {/*  <OrderParagraph bottom>{service.marketing.slimDescription}</OrderParagraph>*/}
      {/*)}*/}
      {!!service.revenue && <div className="font-bold text-2xl tracking-tighter pb">Add-Ons</div>}
      <FormGroup plain>
        <ServiceConfigureForm context={context} type={PerformableFormType.CART} state={scoped} serviceId={serviceId} />
        <React.Suspense fallback={<></>}>
          <ServiceLines serviceId={serviceId} state={scoped} context={context} />
        </React.Suspense>
      </FormGroup>

      {addons.length > 0 && showAddon.current && (
        <>
          {!service.revenue && <div className="font-bold text-2xl tracking-tighter pt-12">Add-Ons</div>}
          <div className={`space-y ${service.revenue ? 'pt-6' : 'pt-2'}`}>{addons}</div>
        </>
      )}

      <OrderButton
        onButton={addService}
        disabled={!Validation(scoped).valid(true) || !(parseFloat(amount) > 0)}
        button={`${typeof versionId !== 'undefined' ? 'Save' : 'Add'} ${
          parseFloat(amount) > 0 ? `for ${money(amount)}` : ' Service'
        }`}
        link={typeof versionId !== 'undefined' ? 'Cancel' : 'Skip this service'}
        onLink={() => onContinue()}
      />
    </div>
  );
}

function CreateServiceForm({
  serviceId,
  context,
  onContinue,
}: Pick<BuyerCreateOrderServiceProps, 'serviceId' | 'context' | 'onContinue'>) {
  const serviceState = usePerformableConfigureState(PerformableFormType.CART, serviceId, []);

  return <ServiceForm serviceId={serviceId} context={context} serviceState={serviceState} onContinue={onContinue} />;
}

function UpdateServiceForm({
  serviceId,
  context,
  onContinue,
  id,
  versionId,
}: Pick<BuyerCreateOrderServiceProps, 'serviceId' | 'context' | 'onContinue' | 'id' | 'versionId'>) {
  const serviceState = useJobConfigureState(PerformableFormType.CART, id);

  return (
    <ServiceForm
      serviceId={serviceId}
      context={context}
      serviceState={serviceState}
      onContinue={onContinue}
      id={id}
      versionId={versionId}
    />
  );
}

export function BuyerOrderService({
  id,
  versionId,
  serviceId,
  caption,
  configure,
  context,
  onContinue,
}: BuyerCreateOrderServiceProps) {
  const { service } = useQueryHook(ShopServiceDocument, { serviceId });

  const add = useState(false);

  const configurable = add.get() || configure;

  return (
    <OrderMarketing marketing={service.marketing} caption={caption} shorten={configurable}>
      <SpinnerLoader>
        {typeof versionId !== 'undefined' ? (
          <UpdateServiceForm
            context={context}
            serviceId={serviceId}
            onContinue={onContinue}
            id={id}
            versionId={versionId}
          />
        ) : (
          <CreateServiceForm context={context} serviceId={serviceId} onContinue={onContinue} />
        )}
      </SpinnerLoader>
    </OrderMarketing>
  );
}
