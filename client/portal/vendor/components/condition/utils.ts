import {
  ConditionComparator,
  ConditionFieldAddressWrite,
  ConditionFieldDateWrite,
  ConditionFieldDynamicWrite,
  ConditionFieldSelectWrite,
  ConditionFieldWrite,
  ConditionPerformableMetadataWrite,
  FieldType,
  VendorConditionFragment,
  VendorRuleFragment,
} from 'shared/generated';

type Condition = VendorRuleFragment['conditions'][0];
type ConditionType = Condition['__typename'];

function emptyDynamic() {
  return {
    select: {} as ConditionFieldSelectWrite,
    date: {} as ConditionFieldDateWrite,
  } as ConditionFieldDynamicWrite;
}

function convertCondition<T extends ConditionType, C extends Condition, R extends Condition & { __typename: T }>(
  typename: T,
  condition: C['__typename'] extends T ? R : C
): R['metadata'] {
  return condition.__typename === typename ? condition.metadata : undefined;
}

export function convertConditions(conditions: VendorConditionFragment[]) {
  return conditions.map((c) => {
    const buyerFieldMetadata = convertCondition('ConditionBuyerField', c);

    let buyerField: ConditionFieldWrite;

    if (buyerFieldMetadata) {
      buyerField = {
        fieldId: buyerFieldMetadata.fieldId,
        existence: buyerFieldMetadata.existence,
        dynamic: emptyDynamic(),
      };

      if (buyerFieldMetadata.dynamic?.__typename === 'ConditionFieldDate') {
        Object.assign(buyerField.dynamic, {
          type: FieldType.Date,
          date: buyerFieldMetadata.dynamic || ({} as ConditionFieldDateWrite),
        });
      } else if (buyerFieldMetadata.dynamic?.__typename === 'ConditionFieldSelect') {
        Object.assign(buyerField.dynamic, {
          type: FieldType.Select,
          select: buyerFieldMetadata.dynamic || ({} as ConditionFieldSelectWrite),
        });
      } else if (buyerFieldMetadata.dynamic?.__typename === 'ConditionFieldAddress') {
        Object.assign(buyerField.dynamic, {
          type: FieldType.Address,
          address: buyerFieldMetadata.dynamic || ({} as ConditionFieldAddressWrite),
        });
      }
    }

    const orderFieldMetadata = convertCondition('ConditionOrderField', c);

    let orderField: ConditionFieldWrite;

    if (orderFieldMetadata) {
      orderField = {
        fieldId: orderFieldMetadata.fieldId,
        existence: orderFieldMetadata.existence,
        dynamic: emptyDynamic(),
      };

      if (orderFieldMetadata.dynamic?.__typename === 'ConditionFieldDate') {
        Object.assign(orderField.dynamic, {
          type: FieldType.Date,
          date: orderFieldMetadata.dynamic || ({} as ConditionFieldDateWrite),
        });
      } else if (orderFieldMetadata.dynamic?.__typename === 'ConditionFieldSelect') {
        Object.assign(orderField.dynamic, {
          type: FieldType.Select,
          select: orderFieldMetadata.dynamic || ({} as ConditionFieldSelectWrite),
        });
      } else if (orderFieldMetadata.dynamic?.__typename === 'ConditionFieldAddress') {
        Object.assign(orderField.dynamic, {
          type: FieldType.Address,
          address: orderFieldMetadata.dynamic || ({} as ConditionFieldAddressWrite),
        });
      }
    }

    const orderPerformableMetadata = convertCondition('ConditionOrderPerformable', c);

    let orderPerformable: ConditionPerformableMetadataWrite;

    if (orderPerformableMetadata) {
      orderPerformable = {
        performableId: orderPerformableMetadata.performableId,
        existence: orderPerformableMetadata.existence,
        field: {
          fieldId: null,
          existence: ConditionComparator.Exists,
          dynamic: emptyDynamic(),
        } as ConditionFieldWrite,
      };

      if (orderPerformableMetadata.field) {
        Object.assign(orderPerformable.field, {
          fieldId: orderPerformableMetadata.field.fieldId,
          existence: orderPerformableMetadata.field.existence,
        });

        if (orderPerformableMetadata.field.dynamic?.__typename === 'ConditionFieldDate') {
          Object.assign(orderPerformable.field.dynamic, {
            type: FieldType.Date,
            date: orderPerformableMetadata.field.dynamic || ({} as ConditionFieldDateWrite),
          });
        } else if (orderPerformableMetadata.field.dynamic?.__typename === 'ConditionFieldSelect') {
          Object.assign(orderPerformable.field.dynamic, {
            type: FieldType.Select,
            select: orderPerformableMetadata.field.dynamic || ({} as ConditionFieldSelectWrite),
          });
        } else if (orderPerformableMetadata.field.dynamic?.__typename === 'ConditionFieldAddress') {
          Object.assign(orderPerformable.field.dynamic, {
            type: FieldType.Address,
            select: orderPerformableMetadata.field.dynamic || ({} as ConditionFieldAddressWrite),
          });
        }
      }
    }

    const performableMetadata = convertCondition('ConditionPerformable', c);

    let performable: ConditionPerformableMetadataWrite;

    if (performableMetadata) {
      performable = {
        performableId: performableMetadata.performableId,
        existence: performableMetadata.existence,
        field: {
          fieldId: null,
          existence: ConditionComparator.Exists,
          dynamic: emptyDynamic(),
        } as ConditionFieldWrite,
      };

      if (performableMetadata.field) {
        Object.assign(performable.field, {
          fieldId: performableMetadata.field.fieldId,
          existence: performableMetadata.field.existence,
        });

        if (performableMetadata.field.dynamic?.__typename === 'ConditionFieldDate') {
          Object.assign(performable.field.dynamic, {
            type: FieldType.Date,
            date: performableMetadata.field.dynamic || ({} as ConditionFieldDateWrite),
          });
        } else if (performableMetadata.field.dynamic?.__typename === 'ConditionFieldSelect') {
          Object.assign(performable.field.dynamic, {
            type: FieldType.Select,
            select: performableMetadata.field.dynamic || ({} as ConditionFieldSelectWrite),
          });
        } else if (performableMetadata.field.dynamic?.__typename === 'ConditionFieldAddress') {
          Object.assign(performable.field.dynamic, {
            type: FieldType.Address,
            select: performableMetadata.field.dynamic || ({} as ConditionFieldAddressWrite),
          });
        }
      }
    }

    return {
      id: c.id,
      group: c.group,
      logic: c.logic,
      type: c.type,
      orderBuyer: convertCondition('ConditionOrderBuyer', c),
      buyerField,
      buyerAddress: convertCondition('ConditionBuyerAddress', c),
      provider: convertCondition('ConditionProvider', c),
      orderPerformable,
      orderField,
      orderSource: convertCondition('ConditionOrderSource', c),
      orderDayOfWeek: convertCondition('ConditionOrderDayOfWeek', c),
      orderTime: convertCondition('ConditionOrderTime', c),
      orderRequestedDayOfWeek: convertCondition('ConditionOrderRequestedDayOfWeek', c),
      orderRequestedTime: convertCondition('ConditionOrderRequestedTime', c),
      appointmentDayOfWeek: convertCondition('ConditionAppointmentDayOfWeek', c),
      appointmentTime: convertCondition('ConditionAppointmentTime', c),
      appointmentAddress: convertCondition('ConditionAppointmentAddress', c),
      performable,
    };
  });
}
