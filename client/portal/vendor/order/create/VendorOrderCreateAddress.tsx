import { State, useState } from '@hookstate/core';
import LocationEditor, { Address } from 'client/global/components/map/LocationEditor';
import Center from 'client/global/components/tailwind/Center';
import { OrderCreateState } from 'client/portal/vendor/order/create/VendorOrderCreateCommon';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import FormAddress, { validateAddress, validatePostalCode } from 'shared/components/form/FormAddress/FormAddress';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import {
  AddressInput,
  AddressOrderDocument,
  FieldValueWrite,
  VendorOrderAddressDefaultFieldsDocument,
  VendorServiceAreaDocument,
} from 'shared/generated';
import { useQueryHook, useQueryPromise } from 'shared/Graph';

export function VendorOrderCreateAddress({
  state,
  fieldState,
  update,
}: {
  state: State<AddressInput>;
  fieldState: State<FieldValueWrite[]>;
  update: (partial: Partial<OrderCreateState>) => Promise<void>;
}) {
  const { vendorId } = useParams();
  const orderOnAddressExists = useState(false);
  const { vendor } = useQueryHook(VendorServiceAreaDocument, { vendorId });
  const checkAddressOrder = useQueryPromise(AddressOrderDocument);
  const propertyFieldsLookup = useQueryPromise(VendorOrderAddressDefaultFieldsDocument);
  const scoped = useState<AddressInput>({
    line1: state.line1?.get() || '',
    line2: state.line2?.get() || '',
    longitude: state.longitude?.get(),
    latitude: state.latitude?.get(),
    city: state.city?.get() || '',
    state: state.state?.get() || '',
    postalCode: state.postalCode?.get() || '',
  });
  const geo = scoped.get();
  const navigate = useNavigate();

  const onAddressChange = async (latitude: number, longitude: number) => {
    const orderAddressData = await checkAddressOrder({
      latitude,
      longitude,
    });
    orderOnAddressExists.set(orderAddressData.orderOnAddressExists);
  };

  const loadPropertyFields = async () => {
    const { addressDefaultFields } = await propertyFieldsLookup({
      vendorId: vendorId,
      address: state.get(),
    });
    fieldState.set((old) => {
      for (const field of addressDefaultFields) {
        const oldField = old.find((o) => o.fieldId === field.fieldId);
        if (oldField) {
          Object.assign(oldField, field);
        }
      }
      return old;
    });
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-grow-0">
        <Center padding className="flex-grow-0">
          <div className="mb-6">
            <div className="text-theme-primary uppercase font-semibold tracking-wide">First things first...</div>
            <div className="font-bold text-3xl lg:text-5xl tracking-tighter text-gray-700 leading-10 lg:pt-2">
              Address Search
            </div>
          </div>
          <div className="flex flex-col space-y-4">
            {orderOnAddressExists.get() && (
              <Message
                type={MessageType.WARNING}
                title="Duplicate Order"
                round
                actions={[
                  {
                    label: 'Search Orders',
                    onClick: () => navigate(`/ui/vendor/${vendorId}/order/dashboard?search=${scoped.line1.get()}`),
                  },
                ]}
              >
                At least one existing order for the address provided has been found in the system.
              </Message>
            )}
            <FormAddress state={scoped} showMap={false} coords={vendor.address} onSave={onAddressChange} />

            {validateAddress(geo, true) && !validatePostalCode(geo.postalCode, vendor.serviceArea) && (
              <Message type={MessageType.ERROR}>The selected postal code is not in the service area</Message>
            )}

            <div>
              <PromiseButton
                disabled={!validateAddress(geo, true) || !validatePostalCode(geo.postalCode, vendor.serviceArea)}
                onClick={async () => {
                  await update({
                    address: {
                      line1: geo.line1,
                      longitude: geo.longitude,
                      latitude: geo.latitude,
                      line2: geo.line2,
                      city: geo.city,
                      state: geo.state,
                      postalCode: geo.postalCode,
                    },
                  });

                  await loadPropertyFields();

                  navigate('../details');

                  return false;
                }}
              >
                Continue
              </PromiseButton>
            </div>
          </div>
        </Center>
      </div>
      <div className="flex-1 relative bg-white">
        <div className="absolute left-0 right-0 top-0 bottom-0 z-10">
          <LocationEditor addressState={scoped as State<Address>} zoom={14} showTypeSelector={true} />
        </div>
      </div>
    </div>
  );
}
