import { State, useState } from '@hookstate/core';
import { useOrderFieldState } from 'client/global/components/fields/OrderFieldsForm';
import Stepper, { StepperStep, StepperStyle } from 'client/global/components/stepper/Stepper';
import Card from 'client/global/components/tailwind/Card';
import Center from 'client/global/components/tailwind/Center';
import { VendorOrderCreateAddress } from 'client/portal/vendor/order/create/VendorOrderCreateAddress';
import { OrderCreateState } from 'client/portal/vendor/order/create/VendorOrderCreateCommon';
import { VendorOrderCreateCustomer } from 'client/portal/vendor/order/create/VendorOrderCreateCustomer';
import VendorOrderCreateDetails from 'client/portal/vendor/order/create/VendorOrderCreateDetails';
import VendorOrderCreateReview from 'client/portal/vendor/order/create/VendorOrderCreateReview';
import VendorOrderCreateSchedule from 'client/portal/vendor/order/create/VendorOrderCreateSchedule';
import VendorOrderCreateServices from 'client/portal/vendor/order/create/VendorOrderCreateServices';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PerformableFormType } from 'shared/components/fields/PerformableConfigureForm';
import { useServiceConfigureFormValidator } from 'shared/components/fields/ServiceConfigureForm';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import { AddressInput, OrderSource, VendorOrderCreateDocument, VendorOrderUpdateDocument } from 'shared/generated';
import { useMutationPromise } from 'shared/Graph';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

function Protect({ state, children }: { state: State<OrderCreateState>; children: JSX.Element }) {
  const navigate = useNavigate();

  if (state.buyer.id.get()) {
    return children;
  }

  return (
    <Center padding>
      <Card>
        <Message
          type={MessageType.WARNING}
          title="Invalid State"
          actions={[{ label: 'Start Over', onClick: () => navigate('./customer') }]}
        >
          You may only access the order creation wizard by starting from the beginning (you cannot use the back button
          to return to a previous step).
        </Message>
      </Card>
    </Center>
  );
}

export default function VendorOrderCreate() {
  const { vendorId } = useParams();

  const state = useState<OrderCreateState>({
    address: null as AddressInput,
    buyer: {
      id: null as string,
      contacts: [],
    },
    scheduled: false,
    details: false,
    source: OrderSource.Vendor,
    orderId: null as string,
    versionId: null as number,
    vendorId,
    requested: [],
    services: [],
  });

  const serviceValidator = useServiceConfigureFormValidator<OrderCreateState['services'][0]>(
    PerformableFormType.VENDOR,
    vendorId
  );

  const fieldState = useOrderFieldState(vendorId);

  // allow user to come back and finish creation and speed up development
  //state.attach(Persistence('vendor-shop-create'));

  ValidationAttach(state, (validator) => {
    validator.buyer.id.required();
    validator.address.required();
    validator.details.required();
    validator.services.required();
    validator.scheduled.required();

    serviceValidator(validator.services);
  });

  const createOrder = useMutationPromise(VendorOrderCreateDocument);
  const updateOrder = useMutationPromise(VendorOrderUpdateDocument);

  const update = async (partial: Partial<OrderCreateState>) => {
    const data = {
      ...state.get(),
      ...partial,
    };

    if (!state.orderId.get()) {
      const created = await createOrder({
        data: {
          vendorId: data.vendorId,
          wizard: true,
          services: [],
          source: OrderSource.Vendor,
          requested: [],
          address: data.address,
          buyer: data.buyer,
          metadata: [],
        },
      });

      state.merge({
        ...data,
        orderId: created.createOrder.id,
        versionId: created.createOrder.versionId,
      });
    } else {
      const updateOrderRes = await updateOrder({
        orderId: data.orderId,
        versionId: data.versionId,
        data: {
          contacts: data.buyer.contacts.filter((contact) => !contact.isDefault),
          requested: data.requested,
          address: data.address,
          metadata: fieldState.get(),
        },
      });

      state.merge({
        ...data,
        versionId: updateOrderRes.updateOrder.versionId,
      });

      if (partial) {
        state.merge(partial);
      }
    }
  };

  const validation = Validation(state);

  const steps: StepperStep[] = [
    {
      complete: () => validation.valid(true, ['buyer']),
      element: <VendorOrderCreateCustomer state={state.buyer} orderId={state.orderId.get()} />,
      key: 'customer',
      name: 'Customer Selection',
      valid: true,
    },
    {
      complete: () => validation.valid(true, ['address']),
      element: (
        <Protect state={state}>
          <VendorOrderCreateAddress fieldState={fieldState} state={state.address} update={update} />
        </Protect>
      ),
      key: 'address',
      name: 'Service Address',
      valid: () => validation.valid(true, ['address']),
    },
    {
      complete: () => validation.valid(true, ['details']),
      element: (
        <Protect state={state}>
          <VendorOrderCreateDetails state={fieldState} update={update} address={state.address} />
        </Protect>
      ),
      key: 'details',
      name: 'Additional Details',
      valid: () => validation.valid(true, ['details']),
    },
    {
      complete: () => validation.valid(true, ['services']),
      element: (
        <Protect state={state}>
          <VendorOrderCreateServices state={state} orderFields={fieldState} address={state.address} />
        </Protect>
      ),
      key: 'services',
      name: 'Service Configuration',
      valid: () => validation.valid(true, ['services']),
    },
    {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      complete: () => useState(state).scheduled.get(),
      element: (
        <Protect state={state}>
          <VendorOrderCreateSchedule state={state} update={update} address={state.address} />
        </Protect>
      ),
      key: 'schedule',
      name: 'Job Scheduling',
      valid: true,
    },
    {
      complete: true,
      element: (
        <Protect state={state}>
          <VendorOrderCreateReview state={state} />
        </Protect>
      ),
      key: 'review',
      name: 'Order Review',
      valid: true,
    },
  ];

  return <Stepper steps={steps} style={StepperStyle.PRIMARY} />;
}
