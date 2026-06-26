import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

/** Promise-based confirmation dialog, rendered globally by ConfirmDialog. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly request = signal<ConfirmRequest | null>(null);
  readonly current = this.request.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => this.request.set({ ...options, resolve }));
  }

  respond(confirmed: boolean): void {
    const req = this.request();
    if (req) {
      req.resolve(confirmed);
      this.request.set(null);
    }
  }
}
