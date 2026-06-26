import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../common/transformers/numeric.transformer';
import { User } from '../../users/entities/user.entity';
import { SaleItem } from './sale-item.entity';

@Entity('sales')
export class Sale extends BaseEntity {
  @Index('IDX_sale_user')
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (user) => user.sales, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  total: number;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true })
  items: SaleItem[];
}
