import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  // OneToMany(() => Product) relation is added in the products step.
}
