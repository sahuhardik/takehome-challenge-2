import { MemberServiceOverrideType } from '@server/enums';
import MemberEntity from '@server/model/member.entity';
import Performable, { PerformableProperty, PerformablePropertyValue } from '@server/model/performable.entity';
import Pricing from '@server/model/shared/orm/pricing.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity()
export default class MemberPerformable extends Pricing {
  @ManyToOne(() => Performable, (service) => service.providers, {
    persistence: false,
    nullable: true,
  })
  @JoinColumn({ name: 'performableId' })
  readonly performable: Promise<Performable>;

  @Column()
  performableId: string;

  @ManyToOne(() => MemberEntity, (member) => member.providerPerformables, {
    persistence: false,
  })
  @JoinColumn({ name: 'providerId' })
  readonly provider: Promise<MemberEntity | undefined>;

  @Column({ nullable: true })
  providerId?: string;

  @Column({ type: 'bool', default: false })
  allowDelegation: boolean;

  @ManyToOne(() => Performable, { nullable: true, persistence: false })
  @JoinColumn({ name: 'delegateId' })
  readonly delegate: Promise<MemberPerformable | null>;

  @Column({ nullable: true })
  delegateId?: string;

  @ManyToOne(() => MemberEntity, (member) => member.buyerPerformables, {
    nullable: true,
    persistence: false,
  })
  @JoinColumn({ name: 'buyerId' })
  readonly buyer: Promise<MemberEntity | null>;

  @Column({ nullable: true })
  buyerId?: string;

  @OneToMany(() => MemberPerformableProperty, (prop) => prop.memberService)
  properties: Promise<MemberPerformableProperty[]>;

  @Column({
    enum: MemberServiceOverrideType,
    type: 'enum',
    default: MemberServiceOverrideType.REPLACE,
  })
  overrideType: MemberServiceOverrideType;
}

@Entity()
export class MemberPerformableProperty extends Pricing {
  @ManyToOne(() => MemberPerformable, (ms) => ms.properties, {
    persistence: false,
  })
  @JoinColumn({ name: 'memberServiceId' })
  readonly memberService: Promise<MemberPerformable>;

  @Column()
  memberServiceId: string;

  @ManyToOne(() => PerformableProperty, (sp) => sp.jobs, { persistence: false })
  @JoinColumn({ name: 'propertyId' })
  readonly property: Promise<PerformableProperty>;

  @Column()
  propertyId: string;

  @ManyToOne(() => PerformablePropertyValue, (sp) => sp.jobs, {
    nullable: true,
    persistence: false,
  })
  @JoinColumn({ name: 'propertyValueId' })
  readonly propertyValue: Promise<PerformablePropertyValue | null>;

  @Column({ nullable: true })
  propertyValueId?: string;

  @Column({
    enum: MemberServiceOverrideType,
    type: 'enum',
    default: MemberServiceOverrideType.REPLACE,
  })
  overrideType: MemberServiceOverrideType;
}
