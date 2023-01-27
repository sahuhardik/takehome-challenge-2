import { NotificationType } from '@common/enums';
import { NotificationChannel } from '@server/enums';
import MemberRole from '@server/model/member-role.entity';
import Base from '@server/model/shared/orm/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { JoinColumn } from 'typeorm/index';

@Entity()
export default class MemberRoleNotification extends Base {
  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @ManyToOne(() => MemberRole, { persistence: false })
  @JoinColumn({ name: 'roleId' })
  readonly role: MemberRole;

  @Column()
  roleId: string;
}
