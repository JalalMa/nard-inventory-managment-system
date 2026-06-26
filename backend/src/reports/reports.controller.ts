import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../common/enums/user-role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';
import { ReportRangeQueryDto } from './dto/report-range.query.dto';
import { StockReportQueryDto } from './dto/stock-report.query.dto';
import { SalesReportDto } from './dto/sales-report.dto';
import { StockReportDto } from './dto/stock-report.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Roles(UserRole.MANAGER)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @ApiOperation({
    summary: 'Sales totals, revenue, top products and daily breakdown (manager only)',
  })
  salesReport(@Query() query: ReportRangeQueryDto): Promise<SalesReportDto> {
    return this.reportsService.salesReport(query);
  }

  @Get('stock')
  @ApiOperation({ summary: 'Stock levels, inventory value and low-stock items (manager only)' })
  stockReport(@Query() query: StockReportQueryDto): Promise<StockReportDto> {
    return this.reportsService.stockReport(query);
  }
}
