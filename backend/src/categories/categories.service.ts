import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  findAll(query: QueryCategoryDto): Promise<Category[]> {
    const qb = this.categoriesRepository.createQueryBuilder('category');
    if (query.search) {
      qb.where('category.name LIKE :search', { search: `%${query.search}%` });
    }
    return qb.orderBy('category.name', 'ASC').getMany();
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    await this.assertNameAvailable(dto.name);
    const category = this.categoriesRepository.create(dto);
    return this.categoriesRepository.save(category);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    if (dto.name && dto.name !== category.name) {
      await this.assertNameAvailable(dto.name, id);
    }
    Object.assign(category, dto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
  }

  /** Guards the unique-name constraint with a friendly 409 before hitting the DB. */
  private async assertNameAvailable(name: string, excludeId?: number): Promise<void> {
    const existing = await this.categoriesRepository.findOne({
      where: excludeId ? { name, id: Not(excludeId) } : { name },
    });
    if (existing) {
      throw new ConflictException(`Category "${name}" already exists`);
    }
  }
}
