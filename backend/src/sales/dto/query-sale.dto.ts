import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** Sales history query: pagination + optional inclusive date range. */
export class QuerySaleDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Only sales on/after this date (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Only sales on/before this date (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  endDate?: string;
}
