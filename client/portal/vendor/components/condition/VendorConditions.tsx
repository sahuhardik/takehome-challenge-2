import { none, State, useState } from '@hookstate/core';
import { ConditionFieldValidator } from 'client/global/components/condition/ConditionField';
import ConditionList, { ConditionListGroup, ConditionListItem } from 'client/global/components/condition/ConditionList';
import Selectable from 'client/global/components/tailwind/Selectable';
import { ConditionComponent } from 'client/portal/vendor/components/rule/condition/common';
import * as React from 'react';
import { ConditionFieldWrite, ConditionLogic, ConditionWrite, FieldType } from 'shared/generated';
import AddIcon from 'shared/icons/AddIcon';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';
import { v4 } from 'uuid';

type Item = { item: ConditionListItem; write: State<ConditionWrite> };
type Grouped = Record<number, { id: string; group: number[]; items: Item[]; children: Grouped }>;

export function VendorConditionsPreSave(state: State<ConditionWrite[]>) {
  // clone object so handleDynamicField does not mutate state
  const write: ConditionWrite[] = JSON.parse(JSON.stringify(state.get()));

  const handleDynamicField = (field: ConditionFieldWrite) => {
    switch (field.dynamic?.type) {
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

  for (const condition of write) {
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

  return write;
}

export default function VendorConditions({
  state,
  types,
  locked = [],
  required = false,
}: {
  state: State<ConditionWrite[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  types: ConditionComponent<any>[];
  locked?: number[];
  required?: boolean;
}) {
  const scoped = useState(state);

  ValidationAttach(scoped, (validator) => {
    ConditionFieldValidator(validator);

    for (const component of types) {
      const conditionState = validator.when((c) => c.type.get() === component.type)[component.key];

      component.validate(conditionState as never);
    }
  });

  const groups: Grouped = {};

  const valid = Validation(scoped).valid(true);

  for (const condition of scoped.values()) {
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
          if (required && scoped.length === 1) {
            condition.set({ id: v4(), logic: ConditionLogic.AND, group: [0] } as unknown as ConditionWrite);
          } else {
            condition.set(none);
          }
        }
      : undefined;

    const conditionComponent = types.find((c) => c.type === condition.type.get());

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
                {types.map((component) => (
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
                scoped.set((conditions) => {
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
              scoped.set((conditions) => {
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
      scoped.filter((c) => c.logic.get() === ConditionLogic.AND && c.group.length === 1).length > 0,
    items: buildGroups(groups),
    locked: locked.includes(0),
    onAdd: valid
      ? (and) => {
          scoped.set((conditions) => {
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

  return <ConditionList group={conditions} />;
}
