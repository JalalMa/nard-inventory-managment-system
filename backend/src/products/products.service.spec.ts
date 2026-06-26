import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import { StockGateway } from '../realtime/stock.gateway';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { QueryProductDto } from './dto/query-product.dto';

interface QbMock {
  leftJoinAndSelect: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getManyAndCount: jest.Mock;
}

const buildQb = (items: Product[] = [], total = 0): QbMock => {
  const qb: Partial<QbMock> = {};
  qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn().mockReturnValue(qb);
  qb.orderBy = jest.fn().mockReturnValue(qb);
  qb.skip = jest.fn().mockReturnValue(qb);
  qb.take = jest.fn().mockReturnValue(qb);
  qb.getManyAndCount = jest.fn().mockResolvedValue([items, total]);
  return qb as QbMock;
};

const makeQuery = (overrides: Partial<QueryProductDto> = {}): QueryProductDto =>
  Object.assign(new QueryProductDto(), overrides);

describe('ProductsService', () => {
  let service: ProductsService;
  let repo: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let categoriesService: { findOne: jest.Mock };
  let stockGateway: { emitStockUpdated: jest.Mock };
  let qb: QbMock;

  beforeEach(() => {
    qb = buildQb([{ id: 1 } as Product], 1);
    repo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOne: jest.fn(),
      create: jest.fn((dto: Partial<Product>) => dto as Product),
      save: jest.fn((entity: Product) => Promise.resolve({ ...entity, id: 1 })),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    categoriesService = { findOne: jest.fn().mockResolvedValue({ id: 1 }) };
    stockGateway = { emitStockUpdated: jest.fn() };
    service = new ProductsService(
      repo as unknown as Repository<Product>,
      categoriesService as unknown as CategoriesService,
      stockGateway as unknown as StockGateway,
    );
  });

  describe('findAll', () => {
    it('returns a paginated envelope with correct meta', async () => {
      qb.getManyAndCount.mockResolvedValue([[{ id: 1 } as Product], 42]);
      const result = await service.findAll(makeQuery({ page: 2, limit: 20 }));
      expect(result.meta).toEqual({ total: 42, page: 2, limit: 20, totalPages: 3 });
      expect(qb.skip).toHaveBeenCalledWith(20); // (page-1)*limit
      expect(qb.take).toHaveBeenCalledWith(20);
    });

    it('applies a FULLTEXT match when search is provided', async () => {
      await service.findAll(makeQuery({ search: 'cola drink' }));
      const matchCall = (qb.andWhere.mock.calls as unknown[][]).find((c) =>
        String(c[0]).includes('MATCH'),
      );
      expect(matchCall).toBeDefined();
      expect(matchCall?.[1]).toEqual({ search: '+cola* +drink*' });
    });

    it('applies category and price-range filters', async () => {
      await service.findAll(makeQuery({ categoryId: 3, minPrice: 5, maxPrice: 10 }));
      const clauses = (qb.andWhere.mock.calls as unknown[][]).map((c) => String(c[0]));
      expect(clauses).toEqual(
        expect.arrayContaining([
          'product.categoryId = :categoryId',
          'product.price >= :minPrice',
          'product.price <= :maxPrice',
        ]),
      );
    });

    it('rejects an inverted price range', async () => {
      await expect(service.findAll(makeQuery({ minPrice: 100, maxPrice: 1 }))).rejects.toThrow(
        BadRequestException,
      );
    });

    it('falls back to the default sort column for an unknown sortBy', async () => {
      await service.findAll(makeQuery({ sortBy: 'hacker; DROP TABLE', sortDir: 'ASC' }));
      expect(qb.orderBy).toHaveBeenCalledWith('product.createdAt', 'ASC');
    });

    it('honours a whitelisted sort column', async () => {
      await service.findAll(makeQuery({ sortBy: 'price', sortDir: 'DESC' }));
      expect(qb.orderBy).toHaveBeenCalledWith('product.price', 'DESC');
    });
  });

  describe('findOne', () => {
    it('throws NotFound when missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne(7)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('validates the category exists before creating', async () => {
      categoriesService.findOne.mockRejectedValue(new NotFoundException());
      await expect(
        service.create({ name: 'X', price: 1, stockQuantity: 1, categoryId: 999 }),
      ).rejects.toThrow(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
