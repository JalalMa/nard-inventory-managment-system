import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { ReportRangeQueryDto } from './dto/report-range.query.dto';
import { StockReportQueryDto } from './dto/stock-report.query.dto';
import { SalesReportDto } from './dto/sales-report.dto';
import { StockReportDto } from './dto/stock-report.dto';

const toInt = (value: unknown): number => {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : 0;
};

const toMoney = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

const toDateString = (value: unknown): string =>
  value instanceof Date ? value.toISOString().slice(0, 10) : String(value);

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemsRepository: Repository<SaleItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async salesReport(query: ReportRangeQueryDto): Promise<SalesReportDto> {
    const totals = await this.applyRange(
      this.salesRepository
        .createQueryBuilder('s')
        .select('COUNT(s.id)', 'count')
        .addSelect('COALESCE(SUM(s.total), 0)', 'revenue'),
      's',
      query,
    ).getRawOne<{ count: string; revenue: string }>();

    const itemsRaw = await this.applyRange(
      this.saleItemsRepository
        .createQueryBuilder('si')
        .innerJoin('si.sale', 's')
        .select('COALESCE(SUM(si.quantity), 0)', 'qty'),
      's',
      query,
    ).getRawOne<{ qty: string }>();

    const topRaw = await this.applyRange(
      this.saleItemsRepository
        .createQueryBuilder('si')
        .innerJoin('si.sale', 's')
        .innerJoin('si.product', 'p')
        .select('p.id', 'productId')
        .addSelect('p.name', 'name')
        .addSelect('SUM(si.quantity)', 'quantitySold')
        .addSelect('SUM(si.lineTotal)', 'revenue')
        .groupBy('p.id')
        .addGroupBy('p.name')
        .orderBy('quantitySold', 'DESC')
        .limit(5),
      's',
      query,
    ).getRawMany<{ productId: string; name: string; quantitySold: string; revenue: string }>();

    const dailyRaw = await this.applyRange(
      this.salesRepository
        .createQueryBuilder('s')
        .select('DATE(s.created_at)', 'date')
        .addSelect('COUNT(s.id)', 'sales')
        .addSelect('SUM(s.total)', 'revenue')
        .groupBy('DATE(s.created_at)')
        .orderBy('date', 'ASC'),
      's',
      query,
    ).getRawMany<{ date: string; sales: string; revenue: string }>();

    const totalSales = toInt(totals?.count);
    const totalRevenue = toMoney(totals?.revenue);

    return {
      range: { startDate: query.startDate ?? null, endDate: query.endDate ?? null },
      totalSales,
      totalRevenue,
      totalItemsSold: toInt(itemsRaw?.qty),
      averageSaleValue: totalSales > 0 ? toMoney(totalRevenue / totalSales) : 0,
      topProducts: topRaw.map((row) => ({
        productId: toInt(row.productId),
        name: row.name,
        quantitySold: toInt(row.quantitySold),
        revenue: toMoney(row.revenue),
      })),
      dailyRevenue: dailyRaw.map((row) => ({
        date: toDateString(row.date),
        sales: toInt(row.sales),
        revenue: toMoney(row.revenue),
      })),
    };
  }

  async stockReport(query: StockReportQueryDto): Promise<StockReportDto> {
    const aggregates = await this.productsRepository
      .createQueryBuilder('p')
      .select('COUNT(p.id)', 'totalProducts')
      .addSelect('COALESCE(SUM(p.stockQuantity), 0)', 'totalStockUnits')
      .addSelect('COALESCE(SUM(p.price * p.stockQuantity), 0)', 'inventoryValue')
      .addSelect('SUM(CASE WHEN p.stockQuantity = 0 THEN 1 ELSE 0 END)', 'outOfStock')
      .addSelect('SUM(CASE WHEN p.stockQuantity <= :threshold THEN 1 ELSE 0 END)', 'lowStock')
      .setParameter('threshold', query.lowStockThreshold)
      .getRawOne<{
        totalProducts: string;
        totalStockUnits: string;
        inventoryValue: string;
        outOfStock: string;
        lowStock: string;
      }>();

    const lowStock = await this.productsRepository
      .createQueryBuilder('p')
      .leftJoin('p.category', 'c')
      .select('p.id', 'id')
      .addSelect('p.name', 'name')
      .addSelect('p.stockQuantity', 'stockQuantity')
      .addSelect('c.name', 'categoryName')
      .where('p.stockQuantity <= :threshold', { threshold: query.lowStockThreshold })
      .orderBy('p.stockQuantity', 'ASC')
      .limit(query.limit)
      .getRawMany<{
        id: string;
        name: string;
        stockQuantity: string;
        categoryName: string | null;
      }>();

    const byCategory = await this.productsRepository
      .createQueryBuilder('p')
      .leftJoin('p.category', 'c')
      .select('c.id', 'categoryId')
      .addSelect('c.name', 'categoryName')
      .addSelect('COUNT(p.id)', 'productCount')
      .addSelect('COALESCE(SUM(p.stockQuantity), 0)', 'stockUnits')
      .addSelect('COALESCE(SUM(p.price * p.stockQuantity), 0)', 'inventoryValue')
      .groupBy('c.id')
      .addGroupBy('c.name')
      .orderBy('inventoryValue', 'DESC')
      .getRawMany<{
        categoryId: string;
        categoryName: string;
        productCount: string;
        stockUnits: string;
        inventoryValue: string;
      }>();

    return {
      totalProducts: toInt(aggregates?.totalProducts),
      totalStockUnits: toInt(aggregates?.totalStockUnits),
      totalInventoryValue: toMoney(aggregates?.inventoryValue),
      outOfStockCount: toInt(aggregates?.outOfStock),
      lowStockCount: toInt(aggregates?.lowStock),
      lowStock: lowStock.map((row) => ({
        id: toInt(row.id),
        name: row.name,
        stockQuantity: toInt(row.stockQuantity),
        categoryName: row.categoryName,
      })),
      byCategory: byCategory.map((row) => ({
        categoryId: toInt(row.categoryId),
        categoryName: row.categoryName,
        productCount: toInt(row.productCount),
        stockUnits: toInt(row.stockUnits),
        inventoryValue: toMoney(row.inventoryValue),
      })),
    };
  }

  private applyRange<T extends { createdAt: Date }>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    query: ReportRangeQueryDto,
  ): SelectQueryBuilder<T> {
    if (query.startDate) {
      qb.andWhere(`${alias}.created_at >= :startDate`, { startDate: new Date(query.startDate) });
    }
    if (query.endDate) {
      qb.andWhere(`${alias}.created_at <= :endDate`, { endDate: new Date(query.endDate) });
    }
    return qb;
  }
}
