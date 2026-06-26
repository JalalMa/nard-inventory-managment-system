import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

interface RepoMock {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
}

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repo: RepoMock;

  const category = (overrides: Partial<Category> = {}): Category =>
    ({ id: 1, name: 'Beverages', description: null, ...overrides }) as Category;

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((dto: Partial<Category>) => dto as Category),
      save: jest.fn((entity: Category) => Promise.resolve(entity)),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    service = new CategoriesService(repo as unknown as Repository<Category>);
  });

  describe('findOne', () => {
    it('throws NotFound when the category is missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });

    it('returns the category when found', async () => {
      const found = category();
      repo.findOne.mockResolvedValue(found);
      await expect(service.findOne(1)).resolves.toBe(found);
    });
  });

  describe('create', () => {
    it('rejects a duplicate name with a 409', async () => {
      repo.findOne.mockResolvedValue(category());
      await expect(service.create({ name: 'Beverages' })).rejects.toThrow(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('persists a new category when the name is free', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.create({ name: 'Snacks', description: 'Chips' });
      expect(repo.save).toHaveBeenCalled();
      expect(result.name).toBe('Snacks');
    });
  });

  describe('update', () => {
    it('rejects renaming to a name already taken by another category', async () => {
      repo.findOne
        .mockResolvedValueOnce(category({ id: 1, name: 'Beverages' })) // findOne(id)
        .mockResolvedValueOnce(category({ id: 2, name: 'Snacks' })); // name availability check
      await expect(service.update(1, { name: 'Snacks' })).rejects.toThrow(ConflictException);
    });

    it('saves merged changes', async () => {
      repo.findOne
        .mockResolvedValueOnce(category({ id: 1, name: 'Beverages' }))
        .mockResolvedValueOnce(null);
      const result = await service.update(1, { name: 'Drinks' });
      expect(result.name).toBe('Drinks');
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('removes an existing category', async () => {
      const found = category();
      repo.findOne.mockResolvedValue(found);
      await service.remove(1);
      expect(repo.remove).toHaveBeenCalledWith(found);
    });
  });
});
