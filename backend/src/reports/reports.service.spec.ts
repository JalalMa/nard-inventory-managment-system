import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { ReportsService } from './reports.service';

/** Chainable QueryBuilder mock whose getRawOne/getRawMany are queued per call. */
const chainable = (getRawOne: jest.Mock, getRawMany: jest.Mock) => {
  const qb: Record<string, jest.Mock> = {};
  for (const method of [
    'select',
    'addSelect',
    'innerJoin',
    'leftJoin',
    'where',
    'andWhere',
    'groupBy',
    'addGroupBy',
    'orderBy',
    'limit',
    'setParameter',
  ]) {
    qb[method] = jest.fn().mockReturnValue(qb);
  }
  qb.getRawOne = getRawOne;
  qb.getRawMany = getRawMany;
  return qb;
};

describe('ReportsService', () => {
  let service: ReportsService;
  let getRawOne: jest.Mock;
  let getRawMany: jest.Mock;
  let repoFactory: { createQueryBuilder: jest.Mock };

  beforeEach(() => {
    getRawOne = jest.fn();
    getRawMany = jest.fn();
    repoFactory = { createQueryBuilder: jest.fn(() => chainable(getRawOne, getRawMany)) };
    service = new ReportsService(
      repoFactory as unknown as Repository<Sale>,
      repoFactory as unknown as Repository<SaleItem>,
      repoFactory as unknown as Repository<Product>,
    );
  });

  describe('salesReport', () => {
    it('aggregates totals, parses numerics and computes the average', async () => {
      getRawOne
        .mockResolvedValueOnce({ count: '2', revenue: '30.00' }) // totals
        .mockResolvedValueOnce({ qty: '5' }); // items sold
      getRawMany
        .mockResolvedValueOnce([
          { productId: '1', name: 'Cola', quantitySold: '3', revenue: '4.50' },
        ]) // top products
        .mockResolvedValueOnce([{ date: '2026-06-26', sales: '2', revenue: '30.00' }]); // daily

      const report = await service.salesReport({});

      expect(report.totalSales).toBe(2);
      expect(report.totalRevenue).toBe(30);
      expect(report.totalItemsSold).toBe(5);
      expect(report.averageSaleValue).toBe(15);
      expect(report.topProducts[0]).toEqual({
        productId: 1,
        name: 'Cola',
        quantitySold: 3,
        revenue: 4.5,
      });
      expect(report.dailyRevenue[0]).toEqual({ date: '2026-06-26', sales: 2, revenue: 30 });
    });

    it('returns a zero average when there are no sales', async () => {
      getRawOne
        .mockResolvedValueOnce({ count: '0', revenue: '0' })
        .mockResolvedValueOnce({ qty: '0' });
      getRawMany.mockResolvedValue([]);

      const report = await service.salesReport({});
      expect(report.averageSaleValue).toBe(0);
      expect(report.topProducts).toEqual([]);
    });
  });

  describe('stockReport', () => {
    it('shapes aggregates, low-stock and per-category breakdown', async () => {
      getRawOne.mockResolvedValueOnce({
        totalProducts: '10',
        totalStockUnits: '100',
        inventoryValue: '250.50',
        outOfStock: '1',
        lowStock: '3',
      });
      getRawMany
        .mockResolvedValueOnce([
          { id: '5', name: 'Milk', stockQuantity: '2', categoryName: 'Dairy' },
        ]) // low stock
        .mockResolvedValueOnce([
          {
            categoryId: '1',
            categoryName: 'Beverages',
            productCount: '4',
            stockUnits: '40',
            inventoryValue: '80.00',
          },
        ]); // by category

      const report = await service.stockReport({ lowStockThreshold: 10, limit: 50 });

      expect(report.totalProducts).toBe(10);
      expect(report.totalInventoryValue).toBe(250.5);
      expect(report.outOfStockCount).toBe(1);
      expect(report.lowStock[0]).toEqual({
        id: 5,
        name: 'Milk',
        stockQuantity: 2,
        categoryName: 'Dairy',
      });
      expect(report.byCategory[0].inventoryValue).toBe(80);
    });
  });
});
