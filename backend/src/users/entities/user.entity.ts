import { Exclude } from 'class-transformer';
import { Column, Entity, OneToMany, Unique, type Relation } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { CommutePost } from '../../posts/entities/commute-post.entity.js';
import { Interest } from '../../interests/entities/interest.entity.js';

@Entity('users')
@Unique(['email'])
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Exclude()
  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @OneToMany(() => CommutePost, (post) => post.owner)
  posts?: Relation<CommutePost>[];

  @OneToMany(() => Interest, (interest) => interest.user)
  interests?: Relation<Interest>[];
}
