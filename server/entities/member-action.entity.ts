import { RelationshipType } from '@server/enums';
import MemberEntity from '@server/model/member.entity';
import Base from '@server/model/shared/orm/base.entity';
import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { JoinColumn } from 'typeorm/index';

@Entity()
@Unique(['member', 'action']) // enforce that there are no duplicated actions per payer
export default class MemberAction extends Base {
  @ManyToOne(() => MemberEntity, (member) => member.actions, { persistence: false })
  @JoinColumn({ name: 'memberId' })
  readonly member: Promise<MemberEntity>;

  @Column()
  memberId: string;

  @Column({ enum: RelationshipType, type: 'enum', nullable: false })
  action: RelationshipType;
}
