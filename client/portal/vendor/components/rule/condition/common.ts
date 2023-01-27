import { State } from '@hookstate/core';
import {
  ConditionAddress,
  ConditionComparator,
  ConditionFieldWrite,
  ConditionPerformableMetadataWrite,
  ConditionType,
  ConditionWrite,
  FieldType,
} from 'shared/generated';
import { DetectValidator } from 'shared/utilities/Validation';

export const fieldPartial: () => Partial<ConditionFieldWrite> = () => ({
  fieldId: null as never,
  existence: ConditionComparator.Exists,
  dynamic: {
    type: null as FieldType,
    date: { comparator: ConditionComparator.Equals },
    select: { comparator: ConditionComparator.Equals, valueId: null as never },
  },
});

export const performablePartial: () => Partial<ConditionPerformableMetadataWrite> = () => ({
  performableId: null as never,
  existence: ConditionComparator.Exists,
  field: fieldPartial() as ConditionFieldWrite,
});

export function addressValidate(validator: DetectValidator<ConditionAddress>) {
  validator.comparator.required();
  validator.postals.required();
  validator.postals.validate((p) => p.every((z) => z.match(/[0-9]+/)), 'Invalid postal codes provided.');
}

export function fieldValidate(validator: DetectValidator<ConditionFieldWrite>) {
  validator.existence.required();

  const exists = validator.when((v) => v.existence.get() === ConditionComparator.Exists);

  const date = exists.dynamic.when((d) => d.type.get() === FieldType.Date).date;
  date.comparator.required();

  const time = date.when((d) => !!d.time.get()).time;
  time.start.required();
  time.stop.required();

  const dow = date.when((d) => !!d.dow.get()).dow;
  dow.comparator.required();

  dow.validate((d) => {
    if (!d) {
      return false;
    }

    if (d.days.length > 0) {
      return true;
    }

    if (d.holidays.length > 0) {
      return true;
    }

    if (typeof d.windowStart === 'number' && typeof d.windowStop === 'number') {
      return true;
    }

    return false;
  });

  const select = exists.dynamic.when((d) => d.type.get() === FieldType.Select && !!d.select.valueId.get()).select;
  select.comparator.required();

  const address = exists.dynamic.when((d) => d.type.get() === FieldType.Address).address;
  address.comparator.required();
}

type Write = Omit<ConditionWrite, 'id' | 'logic' | 'group' | 'type'>;

export interface ConditionComponent<K extends keyof Write> {
  title: string;
  type: ConditionType;
  description: string;
  icon: React.FunctionComponent;
  example?: string;
  key: K;
  preventLockedRemove: boolean;
  component: (state: State<ConditionWrite[K]>, locked: boolean) => React.ReactNode;
  partial: () => Partial<ConditionWrite[K]>;

  validate(validator: DetectValidator<ConditionWrite[K]>);
}
