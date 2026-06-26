import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { StockUpdatePayload } from '../models/stock-update.model';

const STOCK_UPDATED_EVENT = 'stock.updated';

/**
 * Single Socket.IO connection for the app. Re-broadcasts `stock.updated`
 * events as an RxJS stream that feature components can subscribe to.
 */
@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket?: Socket;
  private readonly stockUpdates = new Subject<StockUpdatePayload>();

  connect(): void {
    if (this.socket?.connected) {
      return;
    }
    this.socket = io(environment.socketUrl || '/', {
      transports: ['websocket'],
      autoConnect: true,
    });
    this.socket.on(STOCK_UPDATED_EVENT, (payload: StockUpdatePayload) =>
      this.stockUpdates.next(payload),
    );
  }

  /** Emits whenever any product's stock changes server-side. */
  onStockUpdated(): Observable<StockUpdatePayload> {
    return this.stockUpdates.asObservable();
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = undefined;
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.stockUpdates.complete();
  }
}
