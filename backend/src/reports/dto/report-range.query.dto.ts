import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

/** Optional inclusive date range for the sales report. Omitted = all time. */
export class ReportRangeQueryDto {
  @ApiPropertyOptional({ description: 'Range start (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Range end (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  endDate?: string;
}
