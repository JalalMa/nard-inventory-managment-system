import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

/** Renders active toast notifications in a fixed stack. */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed end-4 top-4 z-50 flex w-80 flex-col gap-2">
      @for (toast of notifications.notifications(); track toast.id) {
        <div
          class="flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg"
          [class.bg-emerald-600]="toast.type === 'success'"
          [class.bg-red-600]="toast.type === 'error'"
          [class.bg-slate-700]="toast.type === 'info'"
        >
          <span>{{ toast.message }}</span>
          <button
            type="button"
            class="text-white/80 hover:text-white"
            (click)="notifications.dismiss(toast.id)"
            aria-label="dismiss"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  readonly notifications = inject(NotificationService);
}
