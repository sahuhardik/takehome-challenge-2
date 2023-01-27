import { none, State, useState } from '@hookstate/core';
import { SlidebarCloseButton, SlidebarOpenLink } from 'client/global/components/button/SlidebarOpenButton';
import FormMoney from 'client/global/components/form/FormMoney';
import { LinkStyle } from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { Tab } from 'client/global/components/tailwind/Tabs';
import { SlidebarContent, SlidebarFooter, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import * as React from 'react';
import { FormGroup, FormGroups, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormSwitch from 'shared/components/form/FormSwitch';
import FormText from 'shared/components/form/FormText';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { FieldType, PerformablePropertyWrite, PropertyPricing, RuleAdjustment, TierInfoWrite } from 'shared/generated';
import AddIcon from 'shared/icons/AddIcon';
import DeleteIcon from 'shared/icons/DeleteIcon';
import EditIcon from 'shared/icons/EditIcon';
import Money from 'shared/utilities/Money';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

export interface TierSidebar {
  text?: string;
  icon?: React.ReactElement;
  style?: LinkStyle;
  state?: State<TierInfoWrite>;
  amountDescription: string;
  added?: Set<string>;
  onSubmit: (data: TierInfoWrite) => void;
}

export function TierSidebar({ amountDescription, state, onSubmit, text, icon, style, added }: TierSidebar) {
  const scopedState = useState({
    from: '',
    revenue: '',
    expense: '',
  });

  ValidationAttach(scopedState, (v) => {
    v.from.validate((x) => x && parseInt(x) > 1 && (!added || !added.has(x)));
  });

  const onClose = (cancel: boolean) => {
    if (!cancel) {
      onSubmit({
        from: parseInt(scopedState.from.get()),
        revenue: scopedState.revenue.get(),
        expense: scopedState.expense.get(),
      });
    }
  };
  return (
    <SlidebarOpenLink
      icon={icon}
      style={style}
      text={text}
      onClose={onClose}
      onClick={() =>
        scopedState.set({
          from: String(state?.from?.get() || ''),
          revenue: state?.revenue?.get() || '',
          expense: state?.expense?.get() || '',
        })
      }
    >
      <SlidebarHeader title="Tier" />
      <SlidebarContent>
        <FormGroup>
          <FormHorizontal
            state={scopedState.revenue}
            name="From"
            description="Apply the following revenue and expense from the following value of the field"
          >
            <FormText state={scopedState.from} disabled={!!state} type="number" />
          </FormHorizontal>
          <FormHorizontal state={scopedState.revenue} name="Revenue" description={amountDescription}>
            <FormMoney state={scopedState.revenue} />
          </FormHorizontal>
          <FormHorizontal state={scopedState.expense} name="Expense" description={amountDescription}>
            <FormMoney state={scopedState.expense} />
          </FormHorizontal>
        </FormGroup>
      </SlidebarContent>
      <SlidebarFooter>
        <SlidebarCloseButton className="w-full" disabled={!Validation(scopedState).valid(true)}>
          {state ? 'Update' : 'Add'}
        </SlidebarCloseButton>
      </SlidebarFooter>
    </SlidebarOpenLink>
  );
}

export default function VendorServicePropertyAccounting(state: State<PerformablePropertyWrite>): Tab {
  const scopedState = useState(state);

  let amountDescription = '';
  let amountEnabled = true;

  if (state.fieldType.get() === FieldType.Select) {
    if (state.values.some((v) => v.revenue.get() && parseFloat(v.revenue.get()) > 0)) {
      amountEnabled = false;
      amountDescription = 'The amount is adjusted based upon the value selected by the user.';
    } else {
      amountDescription = 'The amount is adjusted if any value is selected.';
    }
  } else if (state.fieldType.get() === FieldType.Number) {
    if (state.quantity.get()) {
      amountDescription = 'The amount is adjusted by multiplying the quantity entered.';
    } else {
      amountDescription = 'The amount is adjusted if a value greater than zero is provided.';
    }
  } else if ([FieldType.Multi, FieldType.Single].includes(state.fieldType.get())) {
    amountDescription = 'The amount is adjusted if any non-blank value is provided.';
  } else if (state.fieldType.get() === FieldType.Boolean) {
    amountDescription = 'The amount is adjusted if this property is enabled.';
  } else if (state.fieldType.get() === FieldType.Repeat) {
    amountDescription = 'The amount is adjusted if at least one value is provided.';
  }

  return {
    key: 'paccounting',
    name: 'Accounting',
    useElement: (
      <FormGroups>
        <FormGroup>
          <FormHorizontal state={scopedState.hideOnInvoice} name="Hide on Invoice">
            <FormSwitch state={scopedState.hideOnInvoice} />
          </FormHorizontal>
          <FormHorizontal state={scopedState.pricingType} name="Pricing Type">
            <FormSelect
              state={scopedState.pricingType}
              options={[
                { value: PropertyPricing.Simple, label: 'Simple' },
                { value: PropertyPricing.Matrix, label: 'Matrix' },
              ]}
            />
          </FormHorizontal>
          <FormHorizontal state={scopedState.revenue} name="Revenue" description={amountDescription}>
            <FormMoney
              state={scopedState.revenue}
              disabled={!amountEnabled}
              placeholder={!amountEnabled ? 'Overridden by options' : null}
            />
          </FormHorizontal>
          <FormHorizontal state={scopedState.expense} name="Expense" description={amountDescription}>
            <FormMoney
              state={scopedState.expense}
              disabled={!amountEnabled}
              placeholder={!amountEnabled ? 'Overridden by options' : null}
            />
          </FormHorizontal>
          {[FieldType.Number, FieldType.Repeat].includes(state.fieldType.get()) && (
            <>
              <Table border round>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>From</TableHeadCell>
                    <TableHeadCell>Revenue</TableHeadCell>
                    <TableHeadCell>Expense</TableHeadCell>
                    <TableHeadCell></TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>1</TableCell>
                    <TableCell>
                      <Money>{scopedState.revenue.get()}</Money>
                    </TableCell>
                    <TableCell>
                      <Money>{scopedState.expense.get()}</Money>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  {scopedState.tiers.map((tierInfo) => (
                    <TableRow key={tierInfo.from.get()}>
                      <TableCell>{tierInfo.from.get()}</TableCell>
                      <TableCell>
                        <Money>{tierInfo.revenue.get() || scopedState.revenue.get()}</Money>
                      </TableCell>
                      <TableCell>
                        <Money>{tierInfo.expense.get() || scopedState.expense.get()}</Money>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x items-center">
                          <TierSidebar
                            icon={<EditIcon />}
                            state={tierInfo}
                            amountDescription={amountDescription}
                            onSubmit={(data) => {
                              tierInfo.set(data);
                            }}
                          />
                          <Button
                            slim
                            icon={<DeleteIcon />}
                            style={ButtonStyle.DANGER}
                            onClick={() => tierInfo.set(none)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4}>
                      <TierSidebar
                        text="Add Tier"
                        icon={<AddIcon />}
                        style={LinkStyle.BOLD}
                        amountDescription={amountDescription}
                        added={new Set(scopedState.tiers.get().map((x) => String(x.from)))}
                        onSubmit={(data) => {
                          scopedState.tiers.set((list) => {
                            const newVal = [...list, data];
                            newVal.sort((a, b) => a.from - b.from);
                            return newVal;
                          });
                        }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </>
          )}
          {Validation(scopedState.revenueType).required() && (
            <FormHorizontal state={scopedState.revenueType} name="Adjustment">
              <FormSelect
                state={scopedState.revenueType}
                options={[
                  {
                    value: RuleAdjustment.AdjustFlat,
                    label: 'Add to Service (Flat)',
                  },
                  {
                    value: RuleAdjustment.AdjustQuantity,
                    label: `Add To Service (Multiply ${
                      scopedState.fieldType.get() === FieldType.Number ? 'Input' : 'Quantity'
                    })`,
                  },
                  {
                    value: RuleAdjustment.OverrideTotal,
                    label: 'Override Total Revenue',
                  },
                  {
                    value: RuleAdjustment.OverrideBase,
                    label: 'Override Base Revenue',
                  },
                ]}
              />
            </FormHorizontal>
          )}
        </FormGroup>
      </FormGroups>
    ),
    error: () => !Validation(scopedState).valid(false, ['revenue', 'expense', 'revenueType', 'tiers']),
  };
}
