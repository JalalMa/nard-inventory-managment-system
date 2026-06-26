import { ApiProperty } from '@nestjs/swagger';
import { Sale } from '../entities/sale.entity';

export class InvoiceItemDto {
  @ApiProperty()
  productId: number;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  lineTotal: number;
}

/** Customer-facing invoice rendered from a persisted Sale + its items. */
export class InvoiceDto {
  @ApiProperty()
  saleId: number;

  @ApiProperty({ description: 'Email of the user who processed the sale' })
  cashier: string;

  @ApiProperty()
  total: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: [InvoiceItemDto] })
  items: InvoiceItemDto[];

  static fromSale(sale: Sale): InvoiceDto {
    return {
      saleId: sale.id,
      cashier: sale.user?.email ?? 'unknown',
      total: sale.total,
      createdAt: sale.createdAt,
      items: (sale.items ?? []).map((item) => ({
        productId: item.productId,
        productName: item.product?.name ?? `#${item.productId}`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
    };
  }
}
