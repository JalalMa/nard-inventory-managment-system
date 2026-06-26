import { Module } from '@nestjs/common';
import { StockGateway } from './stock.gateway';

/**
 * Provides the Socket.IO stock gateway to any feature that mutates stock
 * (products, sales). Exported so those modules can emit `stock.updated`.
 */
@Module({
  providers: [StockGateway],
  exports: [StockGateway],
})
export class RealtimeModule {}
