import { none, State, useState } from '@hookstate/core';
import { SlidebarCloseButton } from 'client/global/components/button/SlidebarOpenButton';
import { ConditionFieldValidator } from 'client/global/components/condition/ConditionField';
import ConditionList, { ConditionListGroup, ConditionListItem } from 'client/global/components/condition/ConditionList';
import Card from 'client/global/components/tailwind/Card';
import Center from 'client/global/components/tailwind/Center';
import Selectable from 'client/global/components/tailwind/Selectable';
import RuleConditionAppointmentAddress from 'client/portal/vendor/components/rule/condition/RuleConditionAppointmentAddress';
import RuleConditionAppointmentDayOfWeek from 'client/portal/vendor/components/rule/condition/RuleConditionAppointmentDayOfWeek';
import RuleConditionAppointmentTime from 'client/portal/vendor/components/rule/condition/RuleConditionAppointmentTime';
import RuleConditionBuyerField from 'client/portal/vendor/components/rule/condition/RuleConditionBuyerField';
import RuleConditionOrderBuyer from 'client/portal/vendor/components/rule/condition/RuleConditionOrderBuyer';
import RuleConditionOrderDayOfWeek from 'client/portal/vendor/components/rule/condition/RuleConditionOrderDayOfWeek';
import RuleConditionOrderField from 'client/portal/vendor/components/rule/condition/RuleConditionOrderField';
import RuleConditionOrderPerformable from 'client/portal/vendor/components/rule/condition/RuleConditionOrderPerformable';
import RuleConditionOrderRequestedDayOfWeek from 'client/portal/vendor/components/rule/condition/RuleConditionOrderRequestedDayOfWeek';
import RuleConditionOrderRequestedTime from 'client/portal/vendor/components/rule/condition/RuleConditionOrderRequestedTime';
import RuleConditionOrderSource from 'client/portal/vendor/components/rule/condition/RuleConditionOrderSource';
import RuleConditionOrderTime from 'client/portal/vendor/components/rule/condition/RuleConditionOrderTime';
import RuleConditionPerformable from 'client/portal/vendor/components/rule/condition/RuleConditionPerformable';
import RuleConditionProvider from 'client/portal/vendor/components/rule/condition/RuleConditionProvider';
import VendorRuleAction, { RuleActionValidation } from 'client/portal/vendor/settings/rule/VendorRuleAction';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  ActionWrite,
  ConditionFieldWrite,
  ConditionLogic,
  ConditionWrite,
  FieldType,
  RuleWrite,
  VendorRuleSaveDocument,
} from 'shared/generated';
import { useMutationPromise } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';
import { v4 } from 'uuid';

type Item = { item: ConditionListItem; write: State<ConditionWrite> };
type Grouped = Record<number, { id: string; group: number[]; items: Item[]; children: Grouped }>;

const conditionComponents = [
  RuleConditionBuyerField,
  RuleConditionProvider,
  RuleConditionAppointmentAddress,
  RuleConditionOrderRequestedTime,
  RuleConditionOrderRequestedDayOfWeek,
  RuleConditionAppointmentTime,
  RuleConditionAppointmentDayOfWeek,
  RuleConditionOrderField,
  RuleConditionOrderBuyer,
  RuleConditionOrderPerformable,
  RuleConditionOrderDayOfWeek,
  RuleConditionOrderTime,
  RuleConditionOrderSource,
  RuleConditionPerformable,
];

function Action({ state, only }: { state: State<ActionWrite>; only?: boolean }) {
  const scope = useState(state);

  return (
    <Card
      key={scope.id.get()}
      onRemove={
        only && !scope.type.get()
          ? undefined
          : () => {
              if (only) {
                scope.set({ id: v4() } as unknown as ActionWrite);
              } else {
                scope.set(none);
              }
            }
      }
    >
      <VendorRuleAction state={scope} />
    </Card>
  );
}

export default function VendorRuleForm({
  data,
  locked = [],
  onSave,
}: {
  data?: RuleWrite;
  locked?: number[];
  onSave?: () => void;
}) {
  const state = useState(
    data ||
      ({
        id: v4(),
        actions: [{ id: v4() }],
        conditions: [{ id: v4(), logic: ConditionLogic.AND, group: [0] }],
      } as RuleWrite)
  );

  ValidationAttach(state, (validator) => {
    validator.name.required();
    validator.conditions.required();
    validator.conditions.type.required();

    RuleActionValidation(validator);

    validator.conditions.required();

    ConditionFieldValidator(validator.conditions);

    for (const component of conditionComponents) {
      const conditionState = validator.conditions.when((c) => c.type.get() === component.type)[component.key];

      component.validate(conditionState as never);
    }
  });

  const groups: Grouped = { 0: { id: '0', group: [0], items: [], children: {} } };

  const valid = Validation(state.conditions).valid(true);

  for (const condition of state.conditions.values()) {
    const cloned = condition.group.get().slice(0);

    const rootIndex = cloned.shift();

    let group = groups[rootIndex];

    if (!group) {
      const rootGroup = condition.group.get().slice(0);

      group = groups[rootIndex] = {
        id: `${rootIndex}`,
        group: rootGroup,
        items: [],
        children: {},
      };
    }

    for (const groupIndex of cloned) {
      if (!group.children[groupIndex]) {
        const groupArray = condition.group.get().slice(0);

        group.children[groupIndex] = {
          items: [],
          children: {},
          id: `${group.id}.${groupIndex}`,
          group: groupArray,
        };
      }

      group = group.children[groupIndex];
    }

    const isLocked = locked.includes(group.group[0]);

    const onRemove = valid
      ? () => {
          if (state.conditions.length === 1) {
            condition.set({ id: v4(), logic: ConditionLogic.AND, group: [0] } as unknown as ConditionWrite);
          } else {
            condition.set(none);
          }
        }
      : undefined;

    const conditionComponent = conditionComponents.find((c) => c.type === condition.type.get());

    if (conditionComponent) {
      group.items.push({
        write: condition,
        item: {
          id: condition.id.get(),
          icon: <conditionComponent.icon />,
          onRemove: conditionComponent.preventLockedRemove && isLocked ? undefined : onRemove,
          color: !Validation(condition).valid(true, [conditionComponent.key]) ? 'bg-red-600' : undefined,
          content: conditionComponent.component(condition[conditionComponent.key] as never, isLocked),
        },
      });
    } else {
      group.items.push({
        write: condition,
        item: {
          id: condition.id.get(),
          color: 'bg-theme-secondary',
          icon: <AddIcon />,
          content: (
            <div>
              <div>Choose a condition type:</div>
              <div className="space-y mt">
                {conditionComponents.map((component) => (
                  <Selectable
                    key={component.key}
                    icon={<component.icon />}
                    title={component.title}
                    onClick={() => {
                      condition.merge({
                        type: component.type,
                        [component.key]: component.partial() as never,
                      });
                    }}
                  >
                    {component.description}
                    {component.example && (
                      <p className="mt-2">
                        <strong className="font-semibold text-theme-secondary">Example Use Case:</strong>{' '}
                        {component.example}
                      </p>
                    )}
                  </Selectable>
                ))}
              </div>
            </div>
          ),
        },
      });
    }
  }

  const buildGroups = (grouped: Grouped): ConditionListGroup[] => {
    const groups = Object.values(grouped);

    return groups.map((group) => {
      const children = Object.values(group.children);

      const groupAdd =
        (!children.length && group.items.every((i) => i.write.logic.get() === ConditionLogic.AND)) ||
        children.some((i) => i.items.length === 1 && i.items[0].write.logic.get() === ConditionLogic.AND);

      return {
        items: [
          ...group.items.map((i) => ({
            ...i.item,
            onRemove: group.items.length > 0 ? i.item.onRemove : undefined,
          })),
          ...buildGroups(group.children),
        ],
        locked: group.group.length === 1 && locked.includes(group.group[0]),
        onRemove:
          groups.length > 1
            ? () => {
                state.conditions.set((conditions) => {
                  const shift = [];
                  const unique = new Set<number>();

                  const remaining = conditions.filter((c) => {
                    for (let i = 0; i < group.group.length; i += 1) {
                      if (c.group[i] !== group.group[i]) {
                        if (i === group.group.length - 1) {
                          shift.push(c);
                          unique.add(c.group[i]);
                        }

                        return true;
                      }
                    }

                    return c.group.length !== group.group.length;
                  });

                  if (group.group.length > 1 && shift.length > 0 && unique.size === 1) {
                    // if only children are left, pull them up a level
                    return [
                      ...remaining.map((c) => {
                        if (shift.includes(c)) {
                          const newGroup = c.group.slice(0);
                          newGroup.splice(group.group.length - 1, 1);

                          return {
                            ...c,
                            group: newGroup,
                          };
                        }

                        return c;
                      }),
                    ];
                  }

                  if (!remaining.length) {
                    remaining.push({ id: v4(), logic: ConditionLogic.AND, group: [0] } as unknown as ConditionWrite);
                  }

                  return remaining;
                });
              }
            : undefined,
        and: groupAdd,
        id: group.id,
        onAdd: valid
          ? (and) => {
              state.conditions.set((conditions) => {
                const wrap = (group: number[], logic: ConditionLogic) => {
                  return [
                    ...conditions.map((c) => {
                      for (let i = 0; i < group.length; i += 1) {
                        if (c.group[i] !== group[i]) {
                          return c;
                        }
                      }

                      return {
                        ...c,
                        group: [...group, 0, ...c.group.slice(group.length)],
                      };
                    }),
                    { id: v4(), logic, group: [...group, 1] } as unknown as ConditionWrite,
                  ];
                };

                const siblings = conditions.filter((c) => {
                  for (let i = 0; i < group.group.length; i += 1) {
                    if (c.group[i] !== group.group[i]) {
                      return false;
                    }
                  }

                  return c.group.length === group.group.length;
                });

                const nextIndex =
                  [...siblings, ...children]
                    .map((c) => c.group.slice(0).pop())
                    .reduce((prev, curr) => (curr > prev ? curr : prev), 0) + 1;

                const logic = and ? ConditionLogic.AND : ConditionLogic.OR;

                if (children.length === 0) {
                  if (siblings.length > 1 && siblings.some((s) => s.logic !== logic)) {
                    // if two or more conditions are in a group do not match the requested type, wrap the existing conditions in a new sub-group
                    return wrap(group.group, logic);
                  }

                  return [
                    ...conditions.map((c) => {
                      // make sure all siblings have the same logic type
                      if (siblings.includes(c)) {
                        return {
                          ...c,
                          logic,
                        };
                      }

                      return c;
                    }),
                    { id: v4(), logic, group: group.group } as unknown as ConditionWrite,
                  ];
                }

                if (groupAdd !== and) {
                  return wrap(group.group, logic);
                }

                return [
                  ...conditions,
                  { id: v4(), logic, group: [...group.group, nextIndex] } as unknown as ConditionWrite,
                ];
              });
            }
          : undefined,
      };
    });
  };

  const conditions = {
    id: 'root',
    and:
      locked.includes(0) ||
      state.conditions.filter((c) => c.logic.get() === ConditionLogic.AND && c.group.length === 1).length > 0,
    items: buildGroups(groups),
    locked: locked.includes(0),
    onAdd: valid
      ? (and) => {
          state.conditions.set((conditions) => {
            const siblings = conditions.filter((c) => c.group.length === 1);
            const others = conditions.filter((c) => c.group.length !== 1);
            const logic = and ? ConditionLogic.AND : ConditionLogic.OR;

            if (siblings.length > 1 && siblings.some((s) => s.logic !== logic)) {
              // if two or more conditions are in a group do not match the requested type, wrap the existing conditions in a new sub-group
              return [
                ...others,
                ...siblings.map((c) => ({
                  ...c,
                  group: [0, ...c.group],
                })),
                { id: v4(), logic, group: [0, siblings.length] } as unknown as ConditionWrite,
              ];
            }

            const group = siblings.map((c) => c.group[0]).reduce((prev, curr) => (curr > prev ? curr : prev), 0);

            return [...conditions, { id: v4(), logic, group: [group + 1] } as unknown as ConditionWrite];
          });
        }
      : undefined,
  };

  const { vendorId } = useParams();
  const save = useMutationPromise(VendorRuleSaveDocument);

  return (
    <Center padding>
      <div className="space-y">
        <FormGroup>
          <FormHorizontal state={state.name} name="Name">
            <FormText state={state.name} />
          </FormHorizontal>
        </FormGroup>
        <div>
          <div className="flex items-end justify-between mb-2">
            <div className="text-2xl font-semibold">Actions</div>
            <PromiseButton
              disabled={state.actions}
              style={ButtonStyle.SECONDARY}
              icon={<AddIcon />}
              onClick={() => state.actions.merge([{ id: v4() } as unknown as ActionWrite])}
            >
              Add
            </PromiseButton>
          </div>
          <div className="space-y-4">
            {state.actions.map((action) => (
              <Action state={action} only={state.actions.length === 1} key={action.id.get()} />
            ))}
          </div>
        </div>
        <div className="text-2xl font-semibold">Conditions</div>
        <ConditionList group={conditions} />
        <SlidebarCloseButton
          disabled={state}
          onClick={async () => {
            // clone object so handleDynamicField does not mutate state
            const write = JSON.parse(JSON.stringify(state.get()));

            const handleDynamicField = (field: ConditionFieldWrite) => {
              switch (field.dynamic?.type) {
                case FieldType.Address:
                  field.dynamic =
                    Object.keys(field.dynamic.address).length > 0
                      ? {
                          type: FieldType.Address,
                          address: field.dynamic.address,
                        }
                      : null;
                  break;
                case FieldType.Select:
                  field.dynamic =
                    Object.keys(field.dynamic.select).length > 0
                      ? {
                          type: FieldType.Select,
                          select: field.dynamic.select,
                        }
                      : null;
                  break;
                case FieldType.Date:
                  field.dynamic =
                    Object.keys(field.dynamic.date).length > 0
                      ? {
                          type: FieldType.Date,
                          date: field.dynamic.date,
                        }
                      : null;
                  break;
                default:
                  field.dynamic = null;
              }
            };

            for (const condition of write.conditions) {
              if (condition.orderPerformable?.field) {
                if (!condition.orderPerformable?.field.fieldId) {
                  delete condition.orderPerformable?.field;
                } else {
                  handleDynamicField(condition.orderPerformable.field);
                }
              }

              if (condition.performable?.field) {
                if (!condition.performable?.field.fieldId) {
                  delete condition.performable?.field;
                } else {
                  handleDynamicField(condition.performable.field);
                }
              }

              if (condition.buyerField) {
                handleDynamicField(condition.buyerField);
              }

              if (condition.orderField) {
                handleDynamicField(condition.orderField);
              }
            }

            await save({ vendorId, write });

            onSave && onSave();
          }}
        >
          Save
        </SlidebarCloseButton>
      </div>
    </Center>
  );
}
