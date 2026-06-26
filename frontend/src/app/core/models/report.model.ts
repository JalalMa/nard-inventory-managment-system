export interface TopProduct {
  productId: number;
  name: string;
  quantitySold: number;
  revenue: number;
}

export interface DailyRevenue {
  date: string;
  sales: number;
  revenue: number;
}

export interface SalesReport {
  range: { startDate: string | null; endDate: string | null };
  totalSales: number;
  totalRevenue: number;
  totalItemsSold: number;
  averageSaleValue: number;
  topProducts: TopProduct[];
  dailyRevenue: DailyRevenue[];
}

export interface LowStockItem {
  id: number;
  name: string;
  stockQuantity: number;
  categoryName: string | null;
}

export interface CategoryStock {
  categoryId: number;
  categoryName: string;
  productCount: number;
  stockUnits: number;
  inventoryValue: number;
}

export interface StockReport {
  totalProducts: number;
  totalStockUnits: number;
  totalInventoryValue: number;
  outOfStockCount: number;
  lowStockCount: number;
  lowStock: LowStockItem[];
  byCategory: CategoryStock[];
}
