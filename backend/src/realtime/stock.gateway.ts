import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { STOCK_UPDATED_EVENT, StockUpdatedPayload } from './dto/stock-updated.payload';

const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:4200')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/**
 * Socket.IO gateway broadcasting live stock changes to all connected clients.
 * The single emit point keeps the `stock.updated` contract in one place; both
 * product edits and checkouts call `emitStockUpdated`.
 */
@WebSocketGateway({ cors: { origin: corsOrigins, credentials: true } })
export class StockGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(StockGateway.name);

  @WebSocketServer()
  private readonly server: Server;

  handleConnection(client: Socket): void {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  emitStockUpdated(payload: StockUpdatedPayload): void {
    this.server.emit(STOCK_UPDATED_EVENT, payload);
  }
}
