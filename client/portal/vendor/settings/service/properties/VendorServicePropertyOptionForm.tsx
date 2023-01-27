import { none, State, useState } from '@hookstate/core';
import FormMoney from 'client/global/components/form/FormMoney';
import { VendorConditions } from 'client/portal/vendor/components/VendorConditionsTab';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormNumber from 'shared/components/form/FormNumber';
import FormSwitch from 'shared/components/form/FormSwitch';
import FormText from 'shared/components/form/FormText';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  FieldType,
  PerformablePropertyValueConditionWrite,
  PerformablePropertyValueWrite,
  PerformablePropertyWrite,
  VendorFieldsDocument,
} from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

export default function VendorServicePropertyOptionForm({
  state,
  property,
}: {
  state: State<PerformablePropertyValueWrite>;
  property: State<PerformablePropertyWrite>;
}) {
  const scoped = useState(state);
  const { vendorId } = useParams();

  const fields = useQueryHook(VendorFieldsDocument, { vendorId }, 'cache-and-network');

  const fieldState = useState(fields.vendor.fields);

  return (
    <>
      <FormGroup>
        <FormHorizontal state={scoped.name} name="Name">
          <FormText state={scoped.name} />
        </FormHorizontal>
        <FormHorizontal state={scoped.hidden} name="Hide from Customer">
          <FormSwitch state={scoped.hidden} />
        </FormHorizontal>
        {property.fieldType.get() === FieldType.Select && (
          <>
            <FormHorizontal state={scoped.onsite} name="On-Site Time (Minutes)">
              <FormNumber
                state={scoped.onsite}
                onChange={() => {
                  // TODO: prompt to confirm if the user wants to delete property level
                  // if options have onsite time defined, remove any value set at property level
                  property.onsite.set(none);

                  return true;
                }}
              />
            </FormHorizontal>
            <FormHorizontal state={scoped.revenue} name="Revenue">
              <FormMoney
                state={scoped.revenue}
                onChange={() => {
                  // TODO: prompt to confirm if the user wants to delete property level
                  // if options have revenue time defined, remove any value set at property level
                  property.revenue.set(none);

                  return true;
                }}
              />
            </FormHorizontal>
            <FormHorizontal state={scoped.expense} name="Expense">
              <FormMoney
                state={scoped.expense}
                onChange={() => {
                  // TODO: prompt to confirm if the user wants to delete property level
                  // if options have expense time defined, remove any value set at property level
                  property.expense.set(none);

                  return true;
                }}
              />
            </FormHorizontal>
            <FormHorizontal
              state={scoped.quantity}
              name="Quantity"
              description="The number of deliverables that must be submitted in order to complete the job."
            >
              <FormNumber state={scoped.quantity} />
            </FormHorizontal>
            <FormHorizontal state={scoped.apiValue} name="API Value">
              <FormText state={scoped.apiValue} />
            </FormHorizontal>
          </>
        )}
      </FormGroup>
      <Button
        style={ButtonStyle.SECONDARY}
        onClick={() => {
          scoped.conditions.merge([{} as PerformablePropertyValueConditionWrite]);
        }}
      >
        Add Condition
      </Button>
      <VendorConditions compare field={scoped} all={fieldState} />
    </>
  );
}
