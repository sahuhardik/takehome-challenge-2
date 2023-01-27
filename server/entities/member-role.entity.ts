import { AcknowledgeAssignment, Permission, RoleType } from '@server/enums';
import MemberRoleNotification from '@server/model/member-role-notification.entity';
import MemberUser from '@server/model/member-user.entity';
import MemberEntity from '@server/model/member.entity';
import Base from '@server/model/shared/orm/base.entity';
import { AfterLoad, Column, Entity, ManyToMany, ManyToOne, OneToMany } from 'typeorm';

@Entity()
export default class MemberRole extends Base {
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'enum', enum: RoleType })
  type: RoleType;

  @Column({ type: 'boolean', default: false })
  default: boolean;

  @Column({ type: 'boolean', default: false })
  required: boolean;

  @Column({ type: 'boolean', default: false })
  calendar: boolean;

  @Column({ type: 'enum', enum: Permission, array: true, default: [] })
  permissions: Permission[];

  @Column({ type: 'enum', enum: AcknowledgeAssignment, default: AcknowledgeAssignment.DEFAULT })
  acknowledgeAssignment: AcknowledgeAssignment;

  @OneToMany(() => MemberRoleNotification, (mrn) => mrn.role, {
    persistence: false,
  })
  readonly notifications: Promise<MemberRoleNotification[]>;

  @ManyToOne(() => MemberEntity, (member) => member.roles, { persistence: false })
  readonly member: Promise<MemberEntity>;

  @Column()
  memberId: string;

  @ManyToMany(() => MemberUser, (user) => user.roles, { persistence: false })
  readonly users: Promise<MemberUser[]>;

  @AfterLoad()
  afterLoad() {
    this.permissions = (this.permissions || []).map((x) =>
      Object.values(Permission).find((value) => JSON.stringify(value) === x)
    );
  }
}
