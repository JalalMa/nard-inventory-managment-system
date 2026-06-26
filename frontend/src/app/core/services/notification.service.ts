import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

const AUTO_DISMISS_MS = 4000;

/** Lightweight, signal-based toast notifications rendered by ToastContainer. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 1;
  private readonly items = signal<Notification[]>([]);
  readonly notifications = this.items.asReadonly();

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  info(message: string): void {
    this.push('info', message);
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((n) => n.id !== id));
  }

  private push(type: NotificationType, message: string): void {
    const id = this.nextId++;
    this.items.update((list) => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
  }
}
