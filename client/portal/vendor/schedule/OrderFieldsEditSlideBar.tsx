import { State, useState } from '@hookstate/core';
import OrderFieldsForm, { useOrderUpdateState } from 'client/global/components/fields/OrderFieldsForm';
import Slidebar, { SlidebarContent, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import { VendorScheduleModel } from 'client/portal/vendor/schedule/VendorScheduleModel';
import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup } from 'shared/components/form/FormLayout';
import { VendorOrderCreateDetailsDocument, VendorOrderViewDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

export interface OrderFieldsEditProps {
  orderId: string;
  open: State<boolean>;
  vendorId: string;
}

function Form({ orderId, onSave }: { orderId: string; onSave: () => void }) {
  const { vendorId } = useParams();
  const { order } = useQueryHook(VendorOrderViewDocument, { orderId, vendorId });
  const [state, update] = useOrderUpdateState(order);

  return (
    <>
      <OrderFieldsForm
        vendorId={order.vendorId}
        wrapper={FormGroup}
        state={state.metadata}
        onlyOnRescheduleFields={true}
      />
      <PromiseButton
        key="update"
        onClick={async () => {
          await update();

          onSave();
        }}
      >
        Save
      </PromiseButton>
    </>
  );
}

function Inner({ model }: { model: VendorScheduleModel }) {
  const state = useState({
    open: false,
    orderId: '',
  });

  model.useOrderHasDiff(
    useCallback(
      (orderId) => {
        state.set({
          open: true,
          orderId,
        });
      },
      [state]
    )
  );

  const orderId = state.orderId.get();

  if (!orderId) {
    return <></>;
  }

  return (
    <Slidebar show={state.open.get()} onClose={() => state.open.set(false)}>
      <SlidebarHeader title={`Order #${orderId}`} />
      <SlidebarContent>
        <Form orderId={orderId} key={orderId} onSave={() => state.open.set(false)} />
      </SlidebarContent>
    </Slidebar>
  );
}

export default function OrderFieldsEditSlideBar({ model }: { model: VendorScheduleModel }) {
  const { vendorId } = useParams();

  const { vendor } = useQueryHook(VendorOrderCreateDetailsDocument, { vendorId });

  if (!vendor.fields.some((f) => f.showOnReschedule)) {
    return <></>;
  }

  return <Inner model={model} />;
}
