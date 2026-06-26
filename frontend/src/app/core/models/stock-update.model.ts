/** Mirror of the backend `stock.updated` event contract. */
export interface StockUpdatePayload {
  productId: number;
  stockQuantity: number;
}
