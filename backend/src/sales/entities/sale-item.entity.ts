import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../common/transformers/numeric.transformer';
import { Product } from '../../products/entities/product.entity';
import { Sale } from './sale.entity';

@Entity('sale_items')
export class SaleItem extends BaseEntity {
  @Column({ name: 'sale_id' })
  saleId: number;

  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Index('IDX_sale_item_product')
  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int' })
  quantity: number;

  // Price captured at the moment of sale, independent of later product price changes.
  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  unitPrice: number;

  @Column({
    name: 'line_total',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  lineTotal: number;
}
