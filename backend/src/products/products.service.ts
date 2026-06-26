import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CategoriesService } from '../categories/categories.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

/** Whitelist of columns clients may sort by — prevents SQL injection via sortBy. */
const SORTABLE_COLUMNS = ['name', 'price', 'stockQuantity', 'createdAt'] as const;
const DEFAULT_SORT = 'createdAt';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async findAll(query: QueryProductDto): Promise<PaginatedResponseDto<Product>> {
    const qb = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    this.applyFilters(qb, query);
    this.applySorting(qb, query);

    qb.skip(query.offset).take(query.limit);

    const [items, total] = await qb.getManyAndCount();
    return new PaginatedResponseDto(items, total, query.page, query.limit);
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    await this.categoriesService.findOne(dto.categoryId); // 404 if category missing
    const product = this.productsRepository.create(dto);
    const saved = await this.productsRepository.save(product);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      await this.categoriesService.findOne(dto.categoryId);
    }
    Object.assign(product, dto);
    await this.productsRepository.save(product);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
  }

  private applyFilters(qb: SelectQueryBuilder<Product>, query: QueryProductDto): void {
    if (query.search) {
      qb.andWhere('MATCH(product.name, product.description) AGAINST (:search IN BOOLEAN MODE)', {
        search: this.toBooleanSearch(query.search),
      });
    }
    if (query.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId: query.categoryId });
    }
    if (query.minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
    }
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }
  }

  private applySorting(qb: SelectQueryBuilder<Product>, query: QueryProductDto): void {
    const sortBy = (SORTABLE_COLUMNS as readonly string[]).includes(query.sortBy ?? '')
      ? (query.sortBy as string)
      : DEFAULT_SORT;
    qb.orderBy(`product.${sortBy}`, query.sortDir);
  }

  /**
   * Turns a free-text query into a BOOLEAN-MODE expression with prefix matching,
   * e.g. "cola drink" -> "+cola* +drink*" (all terms required, prefix-expanded).
   */
  private toBooleanSearch(search: string): string {
    return search
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => `+${term.replace(/[+\-><()~*"@]/g, '')}*`)
      .filter((term) => term.length > 2)
      .join(' ');
  }
}
