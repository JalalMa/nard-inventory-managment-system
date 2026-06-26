/**
 * Canonical real-time event contract (constitution RT-1).
 * Emitted on event `stock.updated` after every stock mutation.
 */
export interface StockUpdatedPayload {
  productId: number;
  stockQuantity: number;
}

export const STOCK_UPDATED_EVENT = 'stock.updated';
