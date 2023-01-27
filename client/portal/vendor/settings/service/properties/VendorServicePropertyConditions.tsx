import { none, State, useState } from '@hookstate/core';
import Card from 'client/global/components/tailwind/Card';
import { Tab } from 'client/global/components/tailwind/Tabs';
import * as React from 'react';
import { FormGroup, FormGroups, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  ConditionComparator,
  ConditionLogic,
  FieldType,
  PerformablePropertyConditionWrite,
  PerformablePropertyWrite,
} from 'shared/generated';
import AddIcon from 'shared/icons/AddIcon';
import { Validation } from 'shared/utilities/Validation';

export default function VendorServicePropertyConditions(
  property: State<PerformablePropertyWrite>,
  properties: State<PerformablePropertyWrite[]>
): Tab {
  return {
    name: 'Conditions',
    key: 'pconditions',
    useElement() {
      const propertyState = useState(property); // eslint-disable-line react-hooks/rules-of-hooks
      const propertiesState = useState(properties); // eslint-disable-line react-hooks/rules-of-hooks

      if (propertiesState.length < 2) {
        return <Card>You must have at least two service properties to enable conditions.</Card>;
      }

      if (!propertyState.conditions.length) {
        return <Card>No conditions have been added.</Card>;
      }

      return (
        <FormGroups>
          <>
            {propertyState.conditions.map((condition, index) => {
              const propertyOptions = [];
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

              for (const prop of propertiesState.values()) {
                if (prop.id.get() === propertyState.id.get()) {
                  continue;
                }

                propertyOptions.push({
                  value: prop.id.get(),
                  label: prop.name.get(),
                });

                if (condition.referenceId.get() === prop.id.get() && prop.fieldType.get() === FieldType.Select) {
                  const valueOptions = prop.values.get().map((v) => ({
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
                        label: 'Does Not Equal',
                        value: ConditionComparator.NotEquals,
                      },
                    ];
                  }
                }
              }

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
                      options={propertyOptions}
                      onChange={() => condition.valueId.set(null)}
                    />
                  </FormHorizontal>
                  {value}
                  <FormHorizontal state={condition.comparator} name="Comparator">
                    <FormSelect state={condition.comparator} options={compareOptions} />
                  </FormHorizontal>
                </FormGroup>
              );
            })}
          </>
        </FormGroups>
      );
    },
    useActions() {
      const valid = Validation(useState(property.conditions)).valid(true); // eslint-disable-line react-hooks/rules-of-hooks
      const onClick = () => property.conditions.merge([{} as PerformablePropertyConditionWrite]);

      const props = useState(properties); // eslint-disable-line react-hooks/rules-of-hooks

      if (props.length < 2) {
        return [];
      }

      return [
        <Button key="add" onClick={onClick} disabled={!valid} style={ButtonStyle.SECONDARY} icon={<AddIcon />}>
          Add Condition
        </Button>,
      ];
    },
    error: () => !Validation(useState(property.conditions)).valid(), // eslint-disable-line react-hooks/rules-of-hooks
  };
}
