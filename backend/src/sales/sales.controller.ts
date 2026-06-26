import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySaleDto } from './dto/query-sale.dto';
import { InvoiceDto } from './dto/invoice.dto';

@ApiTags('Sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Checkout a cart: decrement stock atomically and return an invoice' })
  checkout(@CurrentUser('userId') userId: number, @Body() dto: CreateSaleDto): Promise<InvoiceDto> {
    return this.salesService.checkout(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List sales history with totals and items' })
  findAll(@Query() query: QuerySaleDto): Promise<PaginatedResponseDto<InvoiceDto>> {
    return this.salesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single sale invoice' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<InvoiceDto> {
    return this.salesService.getInvoice(id);
  }
}
