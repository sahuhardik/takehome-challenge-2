import { FieldType } from '@common/enums';
import { ConditionComparator, ConditionLogic } from '@common/rules/Condition';
import { EStatedFields, FieldRole, PhotoHubSiteFields, RelaSiteFields, Visibility } from '@server/enums';
import { DeliverableFieldEntity } from '@server/model/deliverable.entity';
import MemberEntity from '@server/model/member.entity';
import Base from '@server/model/shared/orm/base.entity';
import MutableBase from '@server/model/shared/orm/mutable-base.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { JoinColumn } from 'typeorm/index';

@Entity('member_field')
export default class CustomFieldEntity extends Base {
  @Column({ type: 'timestamp with time zone', nullable: true })
  archived?: Date;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'json' })
  metadata: Record<string, any>;

  @ManyToOne(() => MemberEntity, (member) => member.actions, { persistence: false })
  @JoinColumn({ name: 'memberId' })
  readonly member: Promise<MemberEntity>;

  @OneToMany(() => DeliverableFieldEntity, (df) => df.field, {
    persistence: false,
  })
  readonly deliverables: Promise<DeliverableFieldEntity[]>;

  @OneToMany(() => CustomFieldOptionEntity, (value) => value.field, {
    persistence: false,
  })
  private _values: Promise<CustomFieldOptionEntity[]>;

  get values() {
    return this._values.then((values) => values.filter((v) => !v.archived));
  }

  @OneToMany(() => CustomFieldConditionEntity, (mfc) => mfc.field)
  conditions: Promise<CustomFieldConditionEntity[]>;

  @Column()
  memberId: string;

  @Column({ type: 'boolean', default: false })
  defaultable: boolean;

  @Column({ nullable: true })
  defaultValue?: string;

  @Column({ type: 'decimal', nullable: true, precision: 13, scale: 2 })
  revenue?: string;

  @Column({ enum: FieldType, type: 'enum', nullable: false })
  type: FieldType;

  @Column({ enum: FieldRole, type: 'enum', nullable: false })
  role: FieldRole;

  @Column({ type: 'text', nullable: true })
  group: string;

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'enum', enum: PhotoHubSiteFields, nullable: true })
  hdPhotoHub?: PhotoHubSiteFields;

  @Column({ type: 'enum', enum: RelaSiteFields, nullable: true })
  rela?: RelaSiteFields;

  @Column({ type: 'enum', enum: EStatedFields, nullable: true })
  estated?: EStatedFields;

  @Column({ type: 'boolean', default: false })
  requiredOnCreate: boolean;

  @Column({ type: 'boolean', default: false })
  showOnReschedule: boolean;

  @Column({ type: 'boolean', default: false })
  showOnRejection: boolean;

  @Column({ type: 'boolean', default: false })
  showOnScheduleHover: boolean;

  @Column({ type: 'boolean', default: false })
  showBeforeSubmit: boolean;

  @Column({ type: 'boolean', default: false })
  showOnCreateOrder: boolean;

  @Column({ type: 'boolean', default: false })
  showOnHoldOrder: boolean;

  @Column({ type: 'boolean', default: false })
  showOnOrderList: boolean;

  @Column({ type: 'boolean', default: false })
  showOnSelfEdit: boolean;

  @Column({
    type: 'enum',
    enum: Visibility,
    default: Visibility.EXTERNAL,
    enumName: 'performable_property_visibility_enum',
  })
  visibility: Visibility;

  @Column({ type: 'text', nullable: true })
  apiName?: string;
}

@Entity('member_field_value')
export class CustomFieldOptionEntity extends MutableBase {
  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;

  @Column({ type: 'decimal', nullable: true, precision: 13, scale: 2 })
  revenue?: string;

  @Column({ type: 'integer', default: 0 })
  order: number;

  @Column({ type: 'boolean', default: false })
  preselected: boolean;

  @OneToMany(() => DeliverableFieldEntity, (df) => df.field, {
    persistence: false,
  })
  readonly deliverables: Promise<DeliverableFieldEntity[]>;

  @ManyToOne(() => CustomFieldEntity, (mf) => mf.values, {
    persistence: false,
  })
  @JoinColumn({ name: 'fieldId' })
  readonly field: Promise<CustomFieldEntity>;

  @Column({ nullable: true })
  fieldId?: string;
}

@Entity('member_field_condition')
export class CustomFieldConditionEntity extends Base {
  @Column({ type: 'enum', enum: ConditionLogic })
  logic: ConditionLogic;

  @Column({ type: 'enum', enum: ConditionComparator })
  comparator: ConditionComparator;

  @ManyToOne(() => CustomFieldEntity, (mf) => mf.conditions, {
    persistence: false,
  })
  @JoinColumn({ name: 'fieldId' })
  readonly field: Promise<CustomFieldEntity>;

  @Column()
  fieldId: string;

  @ManyToOne(() => CustomFieldEntity, { persistence: false })
  @JoinColumn({ name: 'referenceId' })
  readonly reference: Promise<CustomFieldEntity>;

  @Column()
  referenceId: string;

  @ManyToOne(() => CustomFieldOptionEntity, { persistence: false })
  @JoinColumn({ name: 'valueId' })
  readonly value: Promise<CustomFieldOptionEntity | null>;

  @Column({ nullable: true })
  valueId?: string;
}
