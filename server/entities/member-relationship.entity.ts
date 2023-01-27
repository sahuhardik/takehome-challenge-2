import { InvoiceInterval } from '@common/enums';
import { AreaType, MicrositeType, RelationshipType } from '@server/enums';
import { BuyerNotificationActivity } from '@server/model/ActivityEntity';
import Invoice from '@server/model/invoice.entity';
import CustomFieldEntity from '@server/model/member-field.entity';
import MemberEntity from '@server/model/member.entity';
import PaymentSourceEntity from '@server/model/PaymentSourceEntity';
import Base from '@server/model/shared/orm/base.entity';
import MutableBase from '@server/model/shared/orm/mutable-base.entity';
import Pricing from '@server/model/shared/orm/pricing.entity';
import { NotificationQueueInput } from '@server/services/notification/NotificationService';
import Big from 'big.js';
import { ChildEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, RelationId, TableInheritance } from 'typeorm';
import { Unique } from 'typeorm/index';

@Entity()
@Unique(['active', 'passive', 'type'])
@TableInheritance({ column: 'type' })
export default abstract class MemberRelationship<T = RelationshipType> extends Base {
  @Column({ name: 'action', type: 'enum', enum: RelationshipType, enumName: 'member_relationship_action_enum' })
  type: T;

  /**
   * For cross-referencing imported customers from another system
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  importId?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color?: string;

  @Column({ type: 'text', nullable: true })
  stripeCustomerId?: string;

  @Column({ type: 'text', nullable: true })
  stripeCustomerTestId?: string;

  @ManyToOne(() => MemberEntity, { persistence: false })
  @JoinColumn({ name: 'activeId' })
  private readonly active: Promise<MemberEntity>;

  @RelationId((mr: MemberRelationship) => mr.active)
  private activeId: string;

  @ManyToOne(() => MemberEntity, { persistence: false })
  @JoinColumn({ name: 'passiveId' })
  private readonly passive: Promise<MemberEntity>;

  @RelationId((mr: MemberRelationship) => mr.passive)
  private passiveId: string;

  @Column({ type: 'decimal', precision: 13, scale: 2, default: 0 })
  balance: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  archived?: Date;

  @Column({ type: 'bigint', nullable: true })
  hdPhotoHubApiId: string;

  @Column({ type: 'enum', enum: MicrositeType, nullable: true })
  micrositeType?: MicrositeType;

  @Column({ type: 'text', nullable: true })
  micrositeUserId: string;

  @Column({ type: 'int', default: 0, name: 'ledgerEntries' })
  ledgerEntries?: number;

  @Column({ type: 'int', default: 0 })
  sort?: number;

  @Column({ type: 'int', default: 0 })
  versionId: number;

  @Column({ name: 'businessHours', type: 'jsonb', nullable: true })
  businessHours?: TimeRangeRecord[];

  @OneToMany(() => MemberRelationshipArea, (mra) => mra.relationship, {
    persistence: false,
  })
  readonly areas: Promise<MemberRelationshipArea[]>;

  /**
   * Invoices that are generated for the initiating member.
   */
  @OneToMany(() => Invoice, (invoice) => invoice.payer, { persistence: false })
  readonly payables: Promise<Invoice[]>;

  @OneToMany(() => MemberRelationshipField, (mrf) => mrf.relationship, {
    persistence: false,
  })
  readonly fields: Promise<MemberRelationshipField[]>;

  get balanceBig() {
    return new Big(this.balance || '0');
  }
}

export interface VendorRelationshipEntity<T = RelationshipType> extends MemberRelationship<T> {
  readonly vendor: Promise<MemberEntity>;

  vendorId: string;
}

export interface TimeRecord {
  hour: number;
  minute: number;
}

export interface TimeRangeRecord {
  from: TimeRecord;
  to: TimeRecord;
}

@ChildEntity(RelationshipType.PROVIDER)
export class VendorProviderRelationshipEntity
  extends MemberRelationship<RelationshipType.PROVIDER>
  implements VendorRelationshipEntity
{
  @ManyToOne(() => MemberEntity, { persistence: false })
  @JoinColumn({ name: 'activeId' })
  readonly provider: Promise<MemberEntity>;

  @Column({ name: 'activeId' })
  providerId: string;

  @ManyToOne(() => MemberEntity, { persistence: false })
  @JoinColumn({ name: 'passiveId' })
  readonly vendor: Promise<MemberEntity>;

  @Column({ name: 'passiveId' })
  vendorId: string;

  @Column({ name: 'quickbooksId', type: 'text', nullable: true })
  quickbooksVendorId?: string;
}

@ChildEntity(RelationshipType.BUYER)
export class VendorBuyerRelationshipEntity
  extends MemberRelationship<RelationshipType.BUYER>
  implements VendorRelationshipEntity
{
  @ManyToOne(() => MemberEntity, { persistence: false })
  @JoinColumn({ name: 'activeId' })
  readonly buyer: Promise<MemberEntity>;

  @Column({ name: 'activeId' })
  buyerId: string;

  @ManyToOne(() => MemberEntity, { persistence: false })
  @JoinColumn({ name: 'passiveId' })
  readonly vendor: Promise<MemberEntity>;

  @Column({ name: 'passiveId' })
  vendorId: string;

  @Column({ name: 'post_pay', type: 'boolean' })
  postPay = false;

  @Column({ name: 'net_terms' })
  netTerms?: number;

  @Column({ type: 'enum', enum: InvoiceInterval })
  interval?: InvoiceInterval;

  @Column({ name: 'quickbooksId', type: 'text', nullable: true })
  quickbooksCustomerId?: string;

  @OneToMany(() => PaymentSourceEntity, (ps) => ps.buyerRel, {
    persistence: false,
  })
  readonly paymentSources: Promise<PaymentSourceEntity<unknown>[]>;

  async getActivityNotificationConfig(): Promise<NotificationQueueInput<BuyerNotificationActivity>['activity']> {
    return {
      type: BuyerNotificationActivity,
      metadata: {
        buyerId: this.id,
        memberId: this.vendorId,
        buyerName: (await this.buyer)?.name,
      },
    };
  }
}

@ChildEntity(RelationshipType.BUYER_GROUP)
export class BuyerGroupBuyerRelationshipEntity extends MemberRelationship<RelationshipType.BUYER_GROUP> {
  @Column({ name: 'activeId' })
  buyerId: string;

  @Column({ name: 'passiveId' })
  buyerGroupId: string;
}

@Entity()
export class MemberRelationshipArea extends Pricing {
  @ManyToOne(() => MemberRelationship, (mr) => mr.areas, { persistence: false })
  @JoinColumn({ name: 'relationshipId' })
  readonly relationship: Promise<MemberRelationship>;

  @Column()
  relationshipId: string;

  @Column({ type: 'varchar', length: 10 })
  zipcode: string;

  @Column({ type: 'enum', enum: AreaType })
  areaType: AreaType;
}

@Entity()
export class MemberRelationshipField extends MutableBase {
  @ManyToOne(() => MemberRelationship, (mr) => mr.fields, {
    persistence: false,
  })
  @JoinColumn({ name: 'relationshipId' })
  readonly relationship: Promise<MemberRelationship>;

  @Column()
  relationshipId: string;

  @ManyToOne(() => CustomFieldEntity, { persistence: false })
  @JoinColumn({ name: 'fieldId' })
  readonly field: Promise<CustomFieldEntity>;

  @Column()
  fieldId: string;

  @Column({ type: 'text', nullable: true })
  stringValue: string;

  @Column({ type: 'float', nullable: true })
  numberValue: number;

  @Column({ type: 'boolean', nullable: true, default: null })
  booleanValue: boolean;
}
