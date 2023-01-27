import { TimeZone } from '@common/enums';
import { Field } from '@nestjs/graphql';
import { MemberType, MicrositeType } from '@server/enums';
import BuyerGroupType from '@server/model/buyer-group-type.entity';
import Calendar from '@server/model/calendar.entity';
import DeliverableDestination from '@server/model/deliverable-destination.entity';
import Form from '@server/model/form.entity';
import Job from '@server/model/job.entity';
import MemberAction from '@server/model/member-action.entity';
import CustomFieldEntity from '@server/model/member-field.entity';
import MemberNotification from '@server/model/member-notification.entity';
import MemberPerformable from '@server/model/member-performable.entity';
import {
  TimeRangeRecord,
  VendorBuyerRelationshipEntity,
  VendorProviderRelationshipEntity,
} from '@server/model/member-relationship.entity';
import MemberRole from '@server/model/member-role.entity';
import MemberUser from '@server/model/member-user.entity';
import Order from '@server/model/order.entity';
import PackageEntity from '@server/model/PackageEntity';
import PhoneEntity from '@server/model/phone.entity';
import Service from '@server/model/service.entity';
import Contact from '@server/model/shared/orm/contact.entity';
import Task from '@server/model/task.entity';
import UserEntity from '@server/model/user.entity';
import { AccountingBillLineFormat } from '@server/services/accounting/types';
import { QuickbooksMemberCredentials } from '@server/services/quickbooks/types';
import { Credentials } from 'google-auth-library';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

export class Review {
  /**
   * If true, all deliverables must be signed-off on before kicking off dependant jobs or sending deliverables to buyer.
   */
  @Column({ default: false })
  job: boolean;

  /**
   * If true, all orders must be reviewed internally before confirming with client the order is complete.
   */
  @Column({ default: false })
  order: boolean;
}

/* Start and stop UTC time of notifications sent from vendor in 24-hr format. */
export class NotificationWindow {
  @Column({ type: 'time', default: '07:30' })
  start: string;

  @Column({ type: 'time', default: '21:30' })
  stop: string;
}

export class MemberPreferences {
  @Column(() => Review)
  review: Review;

  @Column(() => NotificationWindow)
  buyerNotificationWindow: NotificationWindow;

  @Column(() => NotificationWindow)
  providerNotificationWindow: NotificationWindow;

  @Column({ type: 'text', nullable: true })
  cartDomain?: string;

  @Column({ type: 'text', nullable: true, name: 'cartThanks' })
  cartThanks?: string;

  @Column({ type: 'text', nullable: true, name: 'cartTerms' })
  cartTerms?: string;

  @Column({ type: 'text', nullable: true, name: 'themePrimary' })
  themePrimary?: string;

  @Column({ type: 'text', nullable: true, name: 'themeSecondary' })
  themeSecondary?: string;

  @Column({ type: 'text', nullable: true, name: 'themeBackground' })
  themeBackground?: string;

  @Column({ type: 'boolean', default: true, name: 'stripeTest' })
  stripeTest?: boolean;

  @Column({ type: 'boolean', default: false })
  confirmOrder?: boolean;

  @Column({ type: 'boolean', default: false })
  providerScheduling?: boolean;

  @Column({ type: 'boolean', default: false })
  inlineScheduling?: boolean;

  @Column({ type: 'boolean', default: true })
  collapseTimeSlots: boolean;

  @Column({ type: 'boolean', default: false })
  requestTimesError: boolean;

  @Column({ type: 'text', nullable: true })
  hdPhotoHubApiKey?: string;

  @Column({ type: 'text', nullable: true })
  hdPhotoHubUrl?: string;

  @Column({ type: 'decimal', precision: 13, scale: 2, default: '0.01' })
  @Field(() => String)
  applicationFee?: string;

  @Column({ type: 'integer', nullable: true })
  buyerReminderMinutes?: number;

  @Column({ type: 'integer', nullable: true })
  buyerArrivalWindowInMinutes?: number;

  @Column({ type: 'time', nullable: true })
  buyerDailyReminder?: string;

  @Column({ type: 'boolean', default: false })
  showCalendarTitles?: boolean;
}

export interface QuickbooksMemberConfig {
  credentials: QuickbooksMemberCredentials;
  vendorAccountId?: string;
  invoiceEmailDisable?: boolean;
  payment?: {
    credentials: QuickbooksMemberCredentials;
    test: boolean;
  };
  billLineFormat?: AccountingBillLineFormat;
}

export interface MicrositeConfig {
  defaultType?: MicrositeType;
  hdPhotoHub?: {
    apiKey: string;
    url: string;
  };
  rela?: {
    apiKey: string;
    token: string;
    uid: string;
  };
}

@Entity({ name: 'member' })
export default class MemberEntity extends Contact {
  constructor() {
    super();

    // avoid migration
    this.timezone = TimeZone.US_EASTERN;
  }

  // TODO: smell, put here to reduce query joins
  @Column({ type: 'int', default: 0 })
  calendarVersion: number;

  @Column({ type: 'int', default: 1 })
  invoiceNumber: number;

  @Column({ type: 'text', nullable: true, name: 'slackTeamId' })
  slackTeamId?: string;

  @Column({ type: 'text', nullable: true, name: 'slackToken' })
  slackToken?: string;

  @Column(() => MemberPreferences)
  preferences: MemberPreferences;

  @Column({ type: 'jsonb', nullable: true })
  quickbooks?: QuickbooksMemberConfig;

  @Column({ nullable: true })
  themeLogoId?: string;

  @Column({ type: 'boolean', name: 'charge_on_acceptance' })
  chargeOnAcceptance: boolean;

  @Column({ type: 'boolean', name: 'charge_on_net' })
  chargeOnNet: boolean;

  @Column({ type: 'boolean' })
  payLaterDefault: boolean;

  @Column({ type: 'boolean', default: false })
  requireRequestTimes?: boolean;

  @Column({ type: 'enum', enum: MemberType, default: MemberType.PERSON })
  type: MemberType;

  @Column({ type: 'jsonb', nullable: true })
  micrositeConfig?: MicrositeConfig;

  @Column({ type: 'text', nullable: true })
  stripeAccountId?: string;

  @Column({ type: 'text', nullable: true })
  stripeRefreshToken?: string;

  @Column({ type: 'text', nullable: true })
  stripeAccessToken?: string;

  @Column({ type: 'text', nullable: true })
  stripePublicKey?: string;

  @Column({ name: 'businessHours', type: 'jsonb', nullable: true })
  businessHours?: TimeRangeRecord[];

  @OneToMany(() => MemberEntity, (member) => member.parent, { persistence: false })
  readonly children: Promise<MemberEntity[]>;

  @OneToMany(() => Form, (f) => f.member, { persistence: false })
  readonly forms: Promise<Form[]>;

  @OneToMany(() => VendorProviderRelationshipEntity, (rel) => rel.provider, {
    persistence: false,
  })
  readonly vendors: Promise<VendorProviderRelationshipEntity[]>;

  @OneToMany(() => PackageEntity, (p) => p.vendor, {
    persistence: false,
  })
  readonly packages: Promise<PackageEntity[]>;

  @OneToMany(() => VendorBuyerRelationshipEntity, (rel) => rel.vendor, {
    persistence: false,
  })
  readonly buyers: Promise<VendorBuyerRelationshipEntity[]>;

  @OneToMany(() => VendorProviderRelationshipEntity, (rel) => rel.vendor, {
    persistence: false,
  })
  readonly providers: Promise<VendorProviderRelationshipEntity[]>;

  /**
   * Declares the roles that a payer is active in.
   */
  @OneToMany(() => MemberAction, (action) => action.member, {
    persistence: false,
  })
  readonly actions: Promise<MemberAction[]>;

  @OneToMany(() => MemberNotification, (mn) => mn.member, {
    persistence: false,
  })
  readonly notifications: Promise<MemberNotification<any>[]>;

  /**
   * Roles that belong to a payer and can define specific levels of access to the payer's account.
   */
  @OneToMany(() => MemberRole, (role) => role.member, { persistence: false })
  readonly roles: Promise<MemberRole[]>;

  /**
   * Buyer Group Types that are specified by the vendor for hierarchical purposes (i.e.: Team, Brokerage) and categorizing different types of member parents.
   */
  @OneToMany(() => BuyerGroupType, (type) => type.member, { persistence: false })
  readonly buyerGroupTypes: Promise<BuyerGroupType[]>;

  /**
   * Users that belong to a payer and can access the payer's account.
   */
  @OneToMany(() => MemberUser, (user) => user.member, { persistence: false })
  readonly users: Promise<MemberUser[]>;

  /**
   * Orders sold by payer as a vendor.
   */
  @OneToMany(() => Order, (order) => order.vendor, { persistence: false })
  readonly orders: Promise<Order[]>;

  /**
   * Jobs that are assigned to a provider.
   */
  @OneToMany(() => Job, (job) => job.assigneeId)
  readonly workload: Promise<Job[]>;

  /**
   * Custom fields a vendor can use for order creation
   */
  @OneToMany(() => CustomFieldEntity, (mf) => mf.member, { persistence: false })
  readonly fields: Promise<CustomFieldEntity[]>;

  /**
   * All of the deliverables that a buyer has received.
   */
  @OneToMany(() => DeliverableDestination, (destination) => destination.member, { persistence: false })
  readonly destinations: DeliverableDestination[];

  /**
   * Services that the payer can sell to buyers as a vendor.
   */
  @OneToMany('Service', 'vendor', { persistence: false })
  readonly vendorServices: Promise<Service[]>;

  @OneToMany('Task', 'vendor', { persistence: false })
  readonly vendorTasks: Promise<Task[]>;

  /**
   * Services that a buyer has overrides for.
   */
  @OneToMany(() => MemberPerformable, (service) => service.buyer, {
    persistence: false,
  })
  readonly buyerPerformables: Promise<MemberPerformable[]>;

  /**
   * Services that a payer as a provider can perform.
   */
  @OneToMany(() => MemberPerformable, (service) => service.provider, {
    persistence: false,
  })
  readonly providerPerformables: Promise<MemberPerformable[]>;

  @ManyToOne(() => PhoneEntity, { nullable: true })
  number: PhoneEntity;

  /**
   * Members can belong to a parent as a form of grouping. Example, Brokerage or Team.
   */
  @ManyToOne(() => MemberEntity, (member) => member.children, { persistence: false })
  @JoinColumn({ name: 'parentId' })
  readonly parent: Promise<MemberEntity>;

  @Column({ nullable: true })
  parentId?: string;

  /**
   * Members that are parents can belong to a group type. Example, Brokerage or Team.
   */
  @ManyToOne(() => BuyerGroupType, (type) => type.members, { persistence: false })
  @JoinColumn({ name: 'buyerGroupTypeId' })
  readonly buyerGroupType: Promise<MemberEntity>;

  @Column({ nullable: true })
  buyerGroupTypeId?: string;

  @OneToMany(() => Calendar, (calendar) => calendar.member, {
    persistence: false,
  })
  readonly calendars: Promise<Calendar[]>;

  @ManyToOne(() => UserEntity)
  @JoinColumn()
  buyerNotificationOverride: Promise<UserEntity>;

  @Column({ type: 'json', nullable: true })
  googleCredentials?: Credentials;

  @Column({ type: 'timestamp with time zone', nullable: true })
  googleStart?: Date;

  @Column({ type: 'text', nullable: true })
  nylasToken?: string;

  @Column({ type: 'text', nullable: true })
  nylasName?: string;

  @Column({ type: 'text', nullable: true })
  nylasCursor?: string;

  @Column({ type: 'text', nullable: true })
  fromEmail?: string;

  @Column({ type: 'enum', enum: TimeZone, default: TimeZone.US_EASTERN })
  timezone: TimeZone;

  @Column({ type: 'jsonb', nullable: true })
  serviceArea?: string[];

  @Column({ nullable: true })
  loginBoxInfo?: string;

  get name() {
    return this.company || `${this.first} ${this.last}`;
  }

  async getWriteCalendar() {
    const calendars = await this.calendars;

    return calendars.find((c) => c.write);
  }

  get supportsNylas() {
    return !!this.nylasToken;
  }
}
