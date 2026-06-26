import { PaginationQuery } from './pagination.model';

export interface InvoiceItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Invoice {
  saleId: number;
  cashier: string;
  total: number;
  createdAt: string;
  items: InvoiceItem[];
}

export interface CartLine {
  productId: number;
  quantity: number;
}

export interface CreateSale {
  items: CartLine[];
}

export interface SaleQuery extends PaginationQuery {
  startDate?: string;
  endDate?: string;
}
