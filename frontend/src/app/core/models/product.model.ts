import { Category } from './category.model';
import { PaginationQuery } from './pagination.model';

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  categoryId: number;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertProduct {
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
}

export interface ProductQuery extends PaginationQuery {
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
}
