import { State, useState } from '@hookstate/core';
import LocationEditor, { Address } from 'client/global/components/map/LocationEditor';
import useCurrentVendor from 'client/global/hooks/useCurrentVendor';
import { useQueryParams } from 'client/global/NavigationUtil';
import { BuyerOrderContent, OrderHeading } from 'client/portal/buyer/BuyerLayout';
import { BuyerCreateOrderState } from 'client/portal/buyer/order/BuyerCreateOrderState';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import FormAddress, { validateAddress, validatePostalCode } from 'shared/components/form/FormAddress/FormAddress';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import { BuyerAddressDefaultFieldsDocument, OrderCreateService, VendorServiceAreaDocument } from 'shared/generated';
import { useQueryHook, useQueryPromise } from 'shared/Graph';
import { ValidationAttach } from 'shared/utilities/Validation';

export default function BuyerCreateOrderAddress({
  state,
  updateOrder,
}: {
  state: State<BuyerCreateOrderState>;
  updateOrder: (service?: OrderCreateService) => Promise<void>;
}) {
  const { vendor: currentVendor } = useCurrentVendor();
  const { vendor } = useQueryHook(VendorServiceAreaDocument, { vendorId: currentVendor.id });
  const propertyFieldsLookup = useQueryPromise(BuyerAddressDefaultFieldsDocument);
  const scoped = useState(state);
  const { review } = useQueryParams();

  ValidationAttach(scoped, (validator) => {
    validator.address.required();
  });

  const navigate = useNavigate();

  const handleConfirm = async () => {
    if (!state.orderId.get()) {
      const { addressDefaultFields } = await propertyFieldsLookup({
        vendorId: currentVendor.id,
        address: scoped.address?.get(),
      });

      state.fields.set((old) => {
        for (const field of addressDefaultFields) {
          const oldField = old.find((o) => o.fieldId === field.fieldId);

          if (oldField) {
            Object.assign(oldField, field);
          }
        }

        return old;
      });
    }

    if (review) {
      await updateOrder();

      navigate('../review');

      return;
    }

    navigate('../schedule');
  };

  const showButton =
    validateAddress(scoped.address?.get(), true) &&
    validatePostalCode(scoped.address?.get().postalCode, vendor.serviceArea);

  return (
    <div className="flex flex-col flex-1">
      <BuyerOrderContent>
        <OrderHeading caption="First things first..." title="Address Search" />

        <div className="pt-6">
          <FormAddress state={scoped.address} showMap={false} coords={currentVendor.address} />
        </div>
        {validateAddress(scoped.address?.get(), true) &&
          !validatePostalCode(scoped.address?.get().postalCode, vendor.serviceArea) && (
            <Message type={MessageType.ERROR} className="mt-6">
              The selected postal code is not in the service area
            </Message>
          )}
        {showButton && (
          <div className="space-x-6 mt-6">
            <PromiseButton snackbar={false} onClick={handleConfirm}>
              Continue
            </PromiseButton>
          </div>
        )}
      </BuyerOrderContent>
      <div className="flex-1 relative bg-white">
        <div className="absolute left-0 right-0 top-0 bottom-0 z-10">
          <LocationEditor addressState={scoped.address as State<Address>} zoom={14} showTypeSelector={true} />
        </div>
      </div>
    </div>
  );
}
