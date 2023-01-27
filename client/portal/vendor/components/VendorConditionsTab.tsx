import { none, State, useState } from '@hookstate/core';
import Card from 'client/global/components/tailwind/Card';
import { Tab } from 'client/global/components/tailwind/Tabs';
import * as React from 'react';
import { FormGroup, FormGroups, FormHorizontal } from 'shared/components/form/FormLayout';
import FormNumber from 'shared/components/form/FormNumber';
import FormSelect from 'shared/components/form/FormSelect';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { ConditionComparator, ConditionLogic, FieldType } from 'shared/generated';
import AddIcon from 'shared/icons/AddIcon';
import { Validation } from 'shared/utilities/Validation';

// TODO: switch to enum for logic once zeus is gone
interface Condition {
  logic: string;
  valueId?: string;
  value?: number;
  comparator: ConditionComparator;
  referenceId: string;
}

interface Conditional {
  id?: string;
  conditions: Condition[];
}

interface Field {
  id: string;
  name: string;
  fieldType: FieldType;
  values: { id: string; name: string }[];
}

export function VendorConditions<C extends Conditional, F extends Field>({
  field,
  all,
  compare = false,
}: {
  compare: boolean;
  field: State<C>;
  all: State<F[]>;
}) {
  const fieldState = useState(field);
  const allState = useState(all);

  if (!fieldState.conditions.length) {
    return <Card>No conditions have been added.</Card>;
  }

  return (
    <FormGroups>
      <>
        {fieldState.conditions.map((condition, index) => {
          const options = [];
          let value = <></>;

          let compareOptions = [
            {
              label: 'Exists',
              value: ConditionComparator.Exists,
            },
            {
              label: 'Does Not Exist',
              value: ConditionComparator.NotExists,
            },
          ];

          for (const field of allState.values()) {
            if (field.id.get() === fieldState.id.get()) {
              continue;
            }

            options.push({
              value: field.id.get(),
              label: field.name.get(),
            });

            if (condition.referenceId.get() !== field.id.get()) {
              continue;
            }

            if (field.fieldType.get() === FieldType.Number) {
              compareOptions.push({
                label: 'Greater Than',
                value: ConditionComparator.GreaterThan,
              });

              compareOptions.push({
                label: 'Greater Than or Equal To',
                value: ConditionComparator.GreaterThanEquals,
              });

              compareOptions.push({
                label: 'Less Than',
                value: ConditionComparator.LessThan,
              });

              compareOptions.push({
                label: 'Less Than or Equal To',
                value: ConditionComparator.LessThanEquals,
              });
            }

            if (field.fieldType.get() === FieldType.Select) {
              const valueOptions = field.values.get().map((v) => ({
                value: v.id,
                label: v.name,
              }));

              value = (
                <FormHorizontal state={condition.valueId} name="Value">
                  <FormSelect state={condition.valueId} options={valueOptions} />
                </FormHorizontal>
              );

              if (condition.valueId.get()) {
                compareOptions = [
                  {
                    label: 'Equals',
                    value: ConditionComparator.Equals,
                  },
                  {
                    label: 'Not Equals',
                    value: ConditionComparator.NotEquals,
                  },
                ];
              }
            }
          }

          const number = [
            ConditionComparator.GreaterThan,
            ConditionComparator.GreaterThanEquals,
            ConditionComparator.LessThan,
            ConditionComparator.LessThanEquals,
          ].includes(condition.comparator.get());

          return (
            <FormGroup onRemove={() => condition.set(none)} key={index}>
              <FormHorizontal state={condition.logic} name="Logic">
                <FormSelect
                  state={condition.logic}
                  options={[
                    { label: 'And', value: ConditionLogic.AND },
                    { label: 'Or', value: ConditionLogic.OR },
                  ]}
                />
              </FormHorizontal>
              <FormHorizontal state={condition.referenceId} name="Property">
                <FormSelect
                  state={condition.referenceId}
                  options={options}
                  onChange={() => condition.valueId.set(null)}
                />
              </FormHorizontal>
              {value}
              {compare && (
                <FormHorizontal state={condition.comparator} name="Check">
                  <FormSelect state={condition.comparator} options={compareOptions} />
                </FormHorizontal>
              )}
              {number && (
                <FormHorizontal state={condition.nested('value')} name="Amount">
                  <FormNumber state={condition.nested('value')} />
                </FormHorizontal>
              )}
            </FormGroup>
          );
        })}
      </>
    </FormGroups>
  );
}

export default function VendorConditionsTab<C extends Conditional, F extends Field>(
  form: State<C>,
  all: State<F[]>
): Tab {
  return {
    name: 'Conditions',
    key: 'conditions',
    useElement() {
      return <VendorConditions field={form} all={all} compare />;
    },
    useActions() {
      const valid = Validation(useState(form.conditions)).valid(true); // eslint-disable-line react-hooks/rules-of-hooks
      const onClick = () => form.conditions.merge([{} as Condition]);

      return [
        <Button key="add" onClick={onClick} disabled={!valid} style={ButtonStyle.SECONDARY} icon={<AddIcon />}>
          Add Condition
        </Button>,
      ];
    },
    error: form.conditions,
  };
}
