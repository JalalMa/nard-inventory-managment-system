import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../common/transformers/numeric.transformer';
import { Category } from '../../categories/entities/category.entity';

@Entity('products')
// FULLTEXT index powers advanced search (MATCH ... AGAINST) on name + description.
@Index('IDX_product_fulltext', ['name', 'description'], { fulltext: true })
export class Product extends BaseEntity {
  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Indexed for fast price-range filtering and sorting.
  @Index('IDX_product_price')
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  price: number;

  @Column({ name: 'stock_quantity', type: 'int', default: 0 })
  stockQuantity: number;

  @Index('IDX_product_category')
  @Column({ name: 'category_id' })
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
