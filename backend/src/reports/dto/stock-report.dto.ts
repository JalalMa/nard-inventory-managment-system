import { ApiProperty } from '@nestjs/swagger';

export class LowStockItemDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty() stockQuantity: number;
  @ApiProperty({ nullable: true }) categoryName: string | null;
}

export class CategoryStockDto {
  @ApiProperty() categoryId: number;
  @ApiProperty() categoryName: string;
  @ApiProperty() productCount: number;
  @ApiProperty() stockUnits: number;
  @ApiProperty() inventoryValue: number;
}

export class StockReportDto {
  @ApiProperty() totalProducts: number;
  @ApiProperty() totalStockUnits: number;
  @ApiProperty({ description: 'Sum of price × stock across all products' })
  totalInventoryValue: number;
  @ApiProperty() outOfStockCount: number;
  @ApiProperty() lowStockCount: number;

  @ApiProperty({ type: [LowStockItemDto] })
  lowStock: LowStockItemDto[];

  @ApiProperty({ type: [CategoryStockDto] })
  byCategory: CategoryStockDto[];
}
