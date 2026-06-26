import { BadRequestException, ConflictException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { StockGateway } from '../realtime/stock.gateway';
import { Product } from '../products/entities/product.entity';
import { Sale } from './entities/sale.entity';
import { SalesService } from './sales.service';

/**
 * In-memory EntityManager stand-in. Tracks product stock so the transactional
 * decrement logic can be asserted without a real database.
 */
class FakeManager {
  constructor(public readonly products: Record<number, Product>) {}

  findOne = jest.fn((_entity: unknown, options: { where: { id: number } }) =>
    Promise.resolve(this.products[options.where.id] ?? null),
  );

  create = jest.fn((_entity: unknown, data: object) => data);

  save = jest.fn((entity: { id?: number }) => Promise.resolve({ id: entity.id ?? 1, ...entity }));
}

describe('SalesService', () => {
  let service: SalesService;
  let salesRepo: { findOne: jest.Mock; findAndCount: jest.Mock };
  let stockGateway: { emitStockUpdated: jest.Mock };
  let manager: FakeManager;
  let dataSource: { transaction: jest.Mock };

  const product = (id: number, stock: number, price = 10): Product =>
    ({ id, name: `P${id}`, price, stockQuantity: stock }) as Product;

  const setup = (products: Product[]) => {
    const byId = Object.fromEntries(products.map((p) => [p.id, p]));
    manager = new FakeManager(byId);
    dataSource = {
      transaction: jest.fn((cb: (m: FakeManager) => unknown) => cb(manager)),
    };
    salesRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        total: 0,
        createdAt: new Date(),
        user: { email: 'employee@nard.io' },
        items: [],
      }),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    stockGateway = { emitStockUpdated: jest.fn() };
    service = new SalesService(
      salesRepo as unknown as Repository<Sale>,
      dataSource as unknown as DataSource,
      stockGateway as unknown as StockGateway,
    );
  };

  describe('checkout', () => {
    it('decrements stock atomically and emits stock.updated after commit', async () => {
      setup([product(1, 100, 2.5), product(2, 50, 4)]);
      await service.checkout(7, {
        items: [
          { productId: 1, quantity: 3 },
          { productId: 2, quantity: 5 },
        ],
      });

      expect(manager.products[1].stockQuantity).toBe(97);
      expect(manager.products[2].stockQuantity).toBe(45);
      // pessimistic write lock requested for each product
      expect(manager.findOne).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
      );
      // emitted exactly once per product, only after the transaction resolves
      expect(stockGateway.emitStockUpdated).toHaveBeenCalledTimes(2);
      expect(stockGateway.emitStockUpdated).toHaveBeenCalledWith({
        productId: 1,
        stockQuantity: 97,
      });
    });

    it('rejects overselling and does not emit or persist', async () => {
      setup([product(1, 2)]);
      await expect(service.checkout(7, { items: [{ productId: 1, quantity: 5 }] })).rejects.toThrow(
        ConflictException,
      );
      expect(manager.products[1].stockQuantity).toBe(2); // unchanged within the (rolled-back) txn path
      expect(stockGateway.emitStockUpdated).not.toHaveBeenCalled();
    });

    it('rejects a cart with duplicate products before opening a transaction', async () => {
      setup([product(1, 100)]);
      await expect(
        service.checkout(7, {
          items: [
            { productId: 1, quantity: 1 },
            { productId: 1, quantity: 2 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('computes the correct total', async () => {
      setup([product(1, 100, 2.5), product(2, 100, 4)]);
      const captured: { total?: number } = {};
      manager.save = jest.fn((entity: { total?: number; id?: number }) => {
        if (entity.total !== undefined) captured.total = entity.total;
        return Promise.resolve({ id: 1, ...entity });
      });
      await service.checkout(7, {
        items: [
          { productId: 1, quantity: 2 }, // 5.00
          { productId: 2, quantity: 1 }, // 4.00
        ],
      });
      expect(captured.total).toBe(9);
    });
  });
});
