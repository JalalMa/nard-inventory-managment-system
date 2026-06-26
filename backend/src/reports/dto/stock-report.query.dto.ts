import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class StockReportQueryDto {
  @ApiPropertyOptional({ default: 10, description: 'Products at or below this stock are "low"' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold: number = 10;

  @ApiPropertyOptional({ default: 50, description: 'Max low-stock rows to return' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number = 50;
}
