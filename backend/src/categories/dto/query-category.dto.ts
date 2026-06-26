import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Optional case-insensitive name search for the category lookup list. */
export class QueryCategoryDto {
  @ApiPropertyOptional({ description: 'Filter categories whose name contains this text' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
