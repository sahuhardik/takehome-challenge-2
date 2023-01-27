import { State } from '@hookstate/core';
import { useQueryParams } from 'client/global/NavigationUtil';
import {
  BuyerCreateOrderState,
  useBuyerOrderCreateStateContext,
} from 'client/portal/buyer/order/BuyerCreateOrderState';
import { BuyerOrderService } from 'client/portal/buyer/order/BuyerOrderService';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OrderCreateService } from 'shared/generated';

export default function BuyerCreateOrderConfigure({
  state,
  updateOrder,
}: {
  updateOrder: (service?: OrderCreateService) => Promise<void>;
  state: State<BuyerCreateOrderState>;
}) {
  const { performableId } = useParams();
  const navigate = useNavigate();
  const { review, jobId, versionId } = useQueryParams();

  const context = useBuyerOrderCreateStateContext(state);

  return (
    <BuyerOrderService
      context={context}
      configure
      id={Array.isArray(jobId) ? jobId[0] : jobId}
      versionId={
        Array.isArray(versionId)
          ? parseInt(versionId[0])
          : typeof versionId !== 'undefined'
          ? parseInt(versionId)
          : undefined
      }
      onContinue={async (service) => {
        if (service) {
          await updateOrder(service);
        }

        navigate(review ? '../review' : '../additional');
      }}
      serviceId={performableId}
    />
  );
}
