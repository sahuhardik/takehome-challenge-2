import { useState } from '@hookstate/core';
import * as React from 'react';
import PromiseButton from 'shared/components/button/PromiseButton';
import FormCheckboxView from 'shared/components/form/FormCheckbox';
import FormSelect from 'shared/components/form/FormSelect';
import FormText from 'shared/components/form/FormText';
import { BuyerPaymentQuickbooksAddDocument } from 'shared/generated';
import { useMutationPromise } from 'shared/Graph';
import QuickBooksApi from 'shared/utilities/QuickBooksApi';
import { ValidationAttach } from 'shared/utilities/Validation';

export default function BuyerPaymentQuickbooks({
  isDefault,
  onSave,
  test = false,
  showDefault = true,
  buyerRelId,
}: {
  isDefault: boolean;
  test?: boolean;
  onSave?: (id: string) => void;
  showDefault?: boolean;
  buyerRelId: string;
}) {
  const addSource = useMutationPromise(BuyerPaymentQuickbooksAddDocument);
  const card = useState({
    number: '',
    expMonth: '',
    expYear: '',
    cvc: '',
  });

  const state = useState({
    err: null as string,
    name: null as string,
    default: isDefault,
    valid: false,
  });

  ValidationAttach(state, (validator) => {
    validator.name.required();
  });

  ValidationAttach(card, (validator) => {
    validator.number.required();
    validator.expMonth.required();
    validator.expYear.required();
    validator.cvc.required();
  });

  return (
    <div className="bg-accent p round border">
      <div className="bg-white p-3 rounded shadow-sm flex-1 block w-full min-w-0 rounded-none rounded-r-md border-gray-300 mb">
        <div className="mb-6">
          <FormText state={state.name} placeholder="Card Name" />
        </div>
        <div className="mb-6">
          <FormText state={card.number} placeholder="Card Number" />
        </div>
        <div className="mb-6 flex flex-wrap -mx-3w-full">
          <div className="w-2/3">
            <div className="flex">
              <FormSelect
                state={card.expMonth}
                placeholder="MM"
                options={[
                  { value: '01', label: '01' },
                  { value: '02', label: '02' },
                  { value: '03', label: '03' },
                  { value: '04', label: '04' },
                  { value: '05', label: '05' },
                  { value: '06', label: '06' },
                  { value: '07', label: '07' },
                  { value: '08', label: '08' },
                  { value: '09', label: '09' },
                  { value: '10', label: '10' },
                  { value: '11', label: '11' },
                  { value: '12', label: '12' },
                ]}
              />
              <FormSelect
                state={card.expYear}
                placeholder="YYYY"
                options={[
                  { value: '2022', label: '2022' },
                  { value: '2023', label: '2023' },
                  { value: '2024', label: '2024' },
                  { value: '2025', label: '2025' },
                  { value: '2026', label: '2026' },
                  { value: '2027', label: '2027' },
                  { value: '2028', label: '2028' },
                  { value: '2029', label: '2029' },
                ]}
              />
            </div>
          </div>
          <div className="w-1/3 pl-3">
            <FormText state={card.cvc} placeholder="CVC" />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x">
        {showDefault && (
          <div className="flex items-center">
            <FormCheckboxView state={state.default} disabled={isDefault} />
            <div className="ml-1">Set as Default</div>
          </div>
        )}

        <PromiseButton
          snackbar={false}
          onClick={async () => {
            const sourceToken = await QuickBooksApi.createToken(
              {
                card: card.get(),
              },
              test
            );

            const resp = await addSource({
              buyerRelId,
              sourceToken,
              name: state.name.get(),
              default: state.default.get(),
            });

            await onSave(resp.addPaymentSource.id);
          }}
        >
          Save Card
        </PromiseButton>
      </div>
    </div>
  );
}
