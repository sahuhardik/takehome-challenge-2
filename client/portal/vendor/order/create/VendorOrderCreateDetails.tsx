import { State } from '@hookstate/core';
import OrderFieldsForm from 'client/global/components/fields/OrderFieldsForm';
import Center from 'client/global/components/tailwind/Center';
import SpinnerLoader from 'client/global/components/tailwind/SpinnerLoader';
import { OrderCreateState } from 'client/portal/vendor/order/create/VendorOrderCreateCommon';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormGroups } from 'shared/components/form/FormLayout';
import { AddressInput, FieldValueWrite } from 'shared/generated';
import CtrlRightIcon from 'shared/icons/CtrlRightIcon';
import { Validation } from 'shared/utilities/Validation';

export default function VendorOrderCreateDetails({
  state,
  update,
  address,
}: {
  state: State<FieldValueWrite[]>;
  address: State<AddressInput>;
  update: (data?: Partial<OrderCreateState>) => Promise<void>;
}) {
  const { vendorId } = useParams();

  const navigate = useNavigate();

  return (
    <Center padding>
      <div className="mb">
        <strong>Address:</strong> {address.get().line1}, {address.get().city}, {address.get().state}{' '}
        {address.get().postalCode}
      </div>
      <SpinnerLoader>
        <FormGroups>
          <OrderFieldsForm wrapper={FormGroup} state={state} vendorId={vendorId} />
        </FormGroups>
        <div className="pt-4">
          <PromiseButton
            disabled={!Validation(state).valid(true)}
            icon={<CtrlRightIcon />}
            onClick={async () => {
              await update({ details: true });

              navigate('../services');

              return false;
            }}
          >
            Continue
          </PromiseButton>
        </div>
      </SpinnerLoader>
    </Center>
  );
}
