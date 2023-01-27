import { NotificationType } from '@common/enums';
import { EmailNotificationMetadata, SlackNotificationMetadata } from '@server/common';
import { NotificationChannel, SMSNotificationDelivery } from '@server/enums';
import MemberEntity from '@server/model/member.entity';
import UserEntity from '@server/model/user.entity';
import {
  ChildEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  TableInheritance,
  Unique,
} from 'typeorm';
import { JoinColumn } from 'typeorm/index';

@Entity()
@TableInheritance({
  column: { type: 'enum', enum: NotificationChannel, name: 'channel' },
})
@Unique(['type', 'channel', 'member'])
export default class MemberNotification<Metadata> {
  // TODO: cannot extend base: https://github.com/typeorm/typeorm/issues/7148

  /**
   * Has to be a string, see https://github.com/typeorm/typeorm/issues/2134
   */
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @CreateDateColumn({ name: 'created' })
  created: Date;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'creator' })
  creator: Promise<UserEntity>;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @ManyToOne(() => MemberEntity, (member) => member.notifications, {
    persistence: false,
  })
  @JoinColumn({ name: 'memberId' })
  readonly member: Promise<MemberEntity>;

  @Column()
  public memberId: string;

  @Column({ type: 'json', default: '{}' })
  metadata: Metadata;

  @Column({ type: 'boolean', default: false })
  global: boolean;

  /**
   * Vendor determines whether sms will always be sent or only sent within the provided time window (with or without queueing).
   */
  @Column({
    type: 'enum',
    enum: SMSNotificationDelivery,
    default: SMSNotificationDelivery.ANYTIME,
  })
  smsDelivery?: SMSNotificationDelivery;

  @Column()
  public message: string;
}

@ChildEntity(NotificationChannel.EMAIL)
export class MemberEmailNotification extends MemberNotification<EmailNotificationMetadata> {}

@ChildEntity(NotificationChannel.SMS)
export class MemberSmsNotification extends MemberNotification<never> {}

@ChildEntity(NotificationChannel.SLACK)
export class MemberSlackNotification extends MemberNotification<SlackNotificationMetadata> {}
