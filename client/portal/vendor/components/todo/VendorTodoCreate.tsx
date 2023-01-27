import { useState } from '@hookstate/core';
import { SlidebarCloseButton } from 'client/global/components/button/SlidebarOpenButton';
import FormCustomer from 'client/global/components/form/FormCustomer';
import { SlidebarContent, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import * as React from 'react';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { ValidationAttach } from 'shared/utilities/Validation';

export default function VendorTodoCreate({
  onSave,
  showCustomer,
}: {
  showCustomer?: boolean;
  onSave: (todo: string, buyerRelId?: string) => void;
}) {
  const state = useState<{ name: string; buyerRelId: string }>({ name: null, buyerRelId: null });

  ValidationAttach(state, (validator) => {
    validator.name.required();
  });

  return (
    <>
      <SlidebarHeader title="Create Todo" />
      <SlidebarContent>
        <FormGroup>
          <FormHorizontal state={state.name} name="Name">
            <FormText state={state.name} />
          </FormHorizontal>

          {showCustomer && (
            <FormHorizontal state={state.buyerRelId} name="Customer">
              <FormCustomer state={state.buyerRelId} />
            </FormHorizontal>
          )}
        </FormGroup>

        <SlidebarCloseButton style={ButtonStyle.QUIET}>Cancel</SlidebarCloseButton>
        <SlidebarCloseButton onClick={() => onSave(state.name.get(), state.buyerRelId.get())} disabled={state}>
          Save
        </SlidebarCloseButton>
      </SlidebarContent>
    </>
  );
}
