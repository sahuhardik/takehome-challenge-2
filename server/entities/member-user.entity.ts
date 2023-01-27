import MemberRole from '@server/model/member-role.entity';
import MemberEntity from '@server/model/member.entity';
import Base from '@server/model/shared/orm/base.entity';
import UserEntity from '@server/model/user.entity';
import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne } from 'typeorm';

@Entity()
export default class MemberUser extends Base {
  /**
   * Default selected payer that a user has access to. This can be changed in the user's profile options.
   */
  @Column({ type: 'boolean', default: 'false', nullable: true })
  default: boolean;

  @ManyToOne(() => MemberEntity, (member) => member.users, { persistence: false })
  @JoinColumn({ name: 'memberId' })
  readonly member: Promise<MemberEntity>;

  @Column()
  memberId: string;

  @ManyToOne(() => UserEntity, { persistence: false })
  @JoinColumn({ name: 'userId' })
  @Index({ where: '"member_user".default = true', unique: true }) // only one selected payer allowed per user
  readonly user: Promise<UserEntity>;

  @Column()
  userId: string;

  @Column({ type: 'boolean', default: 'false' })
  primary: boolean;

  @Column({ type: 'boolean', default: 'false' })
  owner: boolean;

  /**
   * Users can have multiple roles within each payer they have access to.
   */
  @ManyToMany(() => MemberRole, (role) => role.users)
  @JoinTable()
  roles: Promise<MemberRole[]>;
}
