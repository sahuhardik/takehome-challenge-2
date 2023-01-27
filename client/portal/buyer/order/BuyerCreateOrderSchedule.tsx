import { State, useState } from '@hookstate/core';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import { useQueryParams } from 'client/global/NavigationUtil';
import { OrderButton, OrderContent, OrderHeading, OrderParagraph } from 'client/portal/buyer/BuyerLayout';
import {
  BuyerCreateOrderState,
  useBuyerOrderCreateStateContext,
} from 'client/portal/buyer/order/BuyerCreateOrderState';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { BuyerCreateOrderScheduleDocument, OrderCreateService } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import BuyerOrderTimePreferencesPicker from './BuyerOrderTimePreferencesPicker';

export default function BuyerCreateOrderSchedule({
  state,
  updateOrder,
}: {
  updateOrder: (service?: OrderCreateService) => Promise<void>;
  state: State<BuyerCreateOrderState>;
}) {
  const scoped = useState(state);
  const { review } = useQueryParams();
  const navigate = useNavigate();
  const vendorMemberId = useCurrentVendorId();

  const query = useQueryHook(BuyerCreateOrderScheduleDocument, { vendorMemberId });

  const specific = useState(state.requested.length > 0 || query.vendor.requireRequestTimes);

  const context = useBuyerOrderCreateStateContext(scoped);

  return (
    <OrderContent>
      <OrderHeading caption="What date(s) or time(s) work for you?" title="Appointment Preferences" />

      <OrderParagraph>
        While we will do our best to schedule at the date and/or time you prefer, we cannot guarantee those time slots
        will be available.
      </OrderParagraph>
      <BuyerOrderTimePreferencesPicker
        specific={specific}
        query={query}
        requested={scoped.requested}
        orderRuleContext={context}
      />
      <OrderButton
        onButton={async () => {
          if (review) {
            await updateOrder();

            navigate('../review#appointment');

            return;
          }

          navigate('../wizards');
        }}
        button="Continue"
        disabled={specific.get() && scoped.requested.length === 0}
      />

      {/*
      <Selectable title="Follow Up">
        If you are unsure of the best time at this moment, we can reach out prior to creating any appointments.
      </Selectable>
      */}
    </OrderContent>
  );
}
