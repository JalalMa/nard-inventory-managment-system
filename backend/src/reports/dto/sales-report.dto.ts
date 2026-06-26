import { ApiProperty } from '@nestjs/swagger';

export class TopProductDto {
  @ApiProperty() productId: number;
  @ApiProperty() name: string;
  @ApiProperty() quantitySold: number;
  @ApiProperty() revenue: number;
}

export class DailyRevenueDto {
  @ApiProperty({ example: '2026-06-26' }) date: string;
  @ApiProperty() sales: number;
  @ApiProperty() revenue: number;
}

export class SalesReportDto {
  @ApiProperty({ example: { startDate: null, endDate: null } })
  range: { startDate: string | null; endDate: string | null };

  @ApiProperty() totalSales: number;
  @ApiProperty() totalRevenue: number;
  @ApiProperty() totalItemsSold: number;
  @ApiProperty() averageSaleValue: number;

  @ApiProperty({ type: [TopProductDto] })
  topProducts: TopProductDto[];

  @ApiProperty({ type: [DailyRevenueDto] })
  dailyRevenue: DailyRevenueDto[];
}
