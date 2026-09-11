import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, type Relation } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { Interest } from '../../interests/entities/interest.entity.js';
import { PostType } from './post-type.enum.js';

@Entity('commute_posts')
export class CommutePost extends BaseEntity {
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner?: Relation<User>;

  @Column({ type: 'enum', enum: PostType })
  type!: PostType;

  @Index()
  @Column({ type: 'varchar', length: 160 })
  origin!: string;

  @Index()
  @Column({ type: 'varchar', length: 160 })
  destination!: string;

  @Column({ name: 'departure_at', type: 'timestamptz' })
  departureAt!: Date;

  @Column({ name: 'seats_available', type: 'smallint' })
  seatsAvailable!: number;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @OneToMany(() => Interest, (interest) => interest.post)
  interests?: Relation<Interest>[];
}
