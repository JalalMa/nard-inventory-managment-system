import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { Product } from '../products/entities/product.entity';
import { StockGateway } from '../realtime/stock.gateway';
import { StockUpdatedPayload } from '../realtime/dto/stock-updated.payload';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySaleDto } from './dto/query-sale.dto';
import { InvoiceDto } from './dto/invoice.dto';

/** Rounds to 2 decimal places, avoiding binary float drift on money. */
const money = (value: number): number => Math.round(value * 100) / 100;

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    private readonly dataSource: DataSource,
    private readonly stockGateway: StockGateway,
  ) {}

  /**
   * Processes a checkout atomically (FN-2): every product row is locked
   * (`pessimistic_write`) inside one transaction, stock is validated and
   * decremented, a Sale + SaleItems are persisted, and `stock.updated` is
   * broadcast only after a successful commit (RT-1). Any failure rolls back the
   * whole sale, so stock can never oversell.
   */
  async checkout(userId: number, dto: CreateSaleDto): Promise<InvoiceDto> {
    this.assertNoDuplicateProducts(dto.items);

    const { saleId, stockUpdates } = await this.dataSource.transaction(async (manager) => {
      const updates: StockUpdatedPayload[] = [];
      const items: SaleItem[] = [];
      let total = 0;

      for (const line of dto.items) {
        const product = await manager.findOne(Product, {
          where: { id: line.productId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product) {
          throw new NotFoundException(`Product ${line.productId} not found`);
        }
        if (product.stockQuantity < line.quantity) {
          throw new ConflictException(
            `Insufficient stock for "${product.name}": available ${product.stockQuantity}, requested ${line.quantity}`,
          );
        }

        product.stockQuantity -= line.quantity;
        await manager.save(product);

        const lineTotal = money(product.price * line.quantity);
        total = money(total + lineTotal);
        items.push(
          manager.create(SaleItem, {
            productId: product.id,
            quantity: line.quantity,
            unitPrice: product.price,
            lineTotal,
          }),
        );
        updates.push({ productId: product.id, stockQuantity: product.stockQuantity });
      }

      const sale = await manager.save(manager.create(Sale, { userId, total, items }));
      return { saleId: sale.id, stockUpdates: updates };
    });

    // Broadcast only after the transaction has committed.
    stockUpdates.forEach((update) => this.stockGateway.emitStockUpdated(update));

    return this.getInvoice(saleId);
  }

  async findAll(query: QuerySaleDto): Promise<PaginatedResponseDto<InvoiceDto>> {
    const [sales, total] = await this.salesRepository.findAndCount({
      where: this.buildDateFilter(query),
      relations: { user: true, items: { product: true } },
      order: { createdAt: query.sortDir },
      skip: query.offset,
      take: query.limit,
    });
    const invoices = sales.map((sale) => InvoiceDto.fromSale(sale));
    return new PaginatedResponseDto(invoices, total, query.page, query.limit);
  }

  async getInvoice(id: number): Promise<InvoiceDto> {
    const sale = await this.salesRepository.findOne({
      where: { id },
      relations: { user: true, items: { product: true } },
    });
    if (!sale) {
      throw new NotFoundException(`Sale ${id} not found`);
    }
    return InvoiceDto.fromSale(sale);
  }

  private assertNoDuplicateProducts(items: CreateSaleDto['items']): void {
    const ids = items.map((item) => item.productId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Cart contains duplicate products; combine them into one line');
    }
  }

  private buildDateFilter(query: QuerySaleDto): Record<string, unknown> | undefined {
    if (query.startDate && query.endDate) {
      return { createdAt: Between(new Date(query.startDate), new Date(query.endDate)) };
    }
    if (query.startDate) {
      return { createdAt: MoreThanOrEqual(new Date(query.startDate)) };
    }
    if (query.endDate) {
      return { createdAt: LessThanOrEqual(new Date(query.endDate)) };
    }
    return undefined;
  }
}
