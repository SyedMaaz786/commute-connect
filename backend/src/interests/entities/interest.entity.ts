import { Column, Entity, JoinColumn, ManyToOne, Unique, type Relation } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { CommutePost } from '../../posts/entities/commute-post.entity.js';

@Entity('interests')
@Unique(['postId', 'userId'])
export class Interest extends BaseEntity {
  @Column({ name: 'post_id', type: 'uuid' })
  postId!: string;

  @ManyToOne(() => CommutePost, (post) => post.interests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post?: Relation<CommutePost>;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.interests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: Relation<User>;
}
