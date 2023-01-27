import { useState } from '@hookstate/core';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import PhotogError, { PhotogErrorType } from 'common/PhotogError';
import * as React from 'react';
import { useMemo } from 'react';
import PromiseButton from 'shared/components/button/PromiseButton';
import FormCheckboxView from 'shared/components/form/FormCheckbox';
import FormText from 'shared/components/form/FormText';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import { BuyerPaymentStripeAddDocument, BuyerPaymentStripeDocument } from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import CreditCardIcon from 'shared/icons/CreditCardIcon';
import { ValidationAttach } from 'shared/utilities/Validation';

function Inner({
  onSave,
  isDefault,
  showDefault,
  buyerRelId,
}: {
  onSave?: (id: string) => void;
  isDefault: boolean;
  showDefault: boolean;
  buyerRelId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const addPaymentSource = useMutationPromise(BuyerPaymentStripeAddDocument);

  const state = useState({
    err: null as string,
    name: null as string,
    default: isDefault,
    valid: false,
  });

  ValidationAttach(state, (v) => {
    v.name.required();
    v.valid.validate((v) => v);
  });

  let message;

  if (state.err.get()) {
    message = (
      <Message type={MessageType.ERROR} title="Card Not Saved" round>
        {state.err.get()}
      </Message>
    );
  }

  return (
    <>
      <div className="bg-accent p round border flex flex-col space-y-2 sm:space-y">
        {message}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x">
          <div className="sm:w-4/6">
            <FormText state={state.name} placeholder="Name for this credit card" focus />
          </div>

          {showDefault && (
            <div className="flex items-center">
              <FormCheckboxView state={state.default} disabled={isDefault} />
              <div className="ml-1">Set as Default</div>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x">
          <div className="sm:w-4/6">
            <div className="bg-white p-3 rounded w-full shadow-sm rounded-md border border-gray-300 focus:ring-theme-secondary focus:border-theme-secondary hover:border-theme-secondary">
              <CardElement
                options={{ style: { base: { fontSize: '16px' } } }}
                onChange={(e) => {
                  state.valid.set(e.complete);
                }}
              />
            </div>
          </div>

          <PromiseButton
            className="flex-1"
            icon={<CreditCardIcon />}
            disabled={state}
            snackbar={false}
            onClick={async () => {
              const resp = await stripe.createPaymentMethod({
                type: 'card',
                card: elements.getElement(CardElement),
              });

              if (resp.error?.message) {
                state.err.set(resp.error.message);

                return;
              }
              try {
                const result = await addPaymentSource({
                  name: state.name.get(),
                  default: state.default.get(),
                  buyerRelId,
                  sourceToken: resp.paymentMethod.id,
                });

                onSave && onSave(result.addPaymentSource.id);
              } catch (ex) {
                if (PhotogError.isType(ex, PhotogErrorType.CARD_ADD_FAILED)) {
                  state.err.set(ex.metadata.message);
                  return;
                }
                throw ex;
              }
            }}
          >
            Save Card
          </PromiseButton>
        </div>
      </div>
    </>
  );
}

export default function BuyerPaymentStripe({
  onSave,
  isDefault,
  showDefault = true,
  buyerRelId,
}: {
  buyerRelId: string;
  onSave?: (id: string) => void;
  isDefault?: boolean;
  showDefault?: boolean;
}) {
  const vendorId = useCurrentVendorId();

  // has to be network-only since vendor may exist in cache without stripePublicKey retrieved
  const { vendor } = useQueryHook(BuyerPaymentStripeDocument, { vendorId }, 'network-only');

  const stripePromise = useMemo(
    () =>
      loadStripe(vendor.stripePublicKey, {
        stripeAccount: vendor.stripeAccountId,
      }),
    [vendor.stripePublicKey, vendor.stripeAccountId]
  );

  return (
    <Elements stripe={stripePromise}>
      <Inner onSave={onSave} isDefault={!!isDefault} showDefault={showDefault} buyerRelId={buyerRelId} />
    </Elements>
  );
}
