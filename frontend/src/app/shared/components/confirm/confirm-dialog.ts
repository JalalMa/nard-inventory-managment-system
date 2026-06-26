import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Modal } from '../modal/modal';
import { ConfirmService } from './confirm.service';

/** Global host that renders the active confirmation request. Place once in app root. */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Modal, TranslatePipe],
  template: `
    @if (confirm.current(); as req) {
      <app-modal [title]="req.title" (dismiss)="confirm.respond(false)">
        <p class="text-sm text-slate-600">{{ req.message }}</p>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="btn-secondary" (click)="confirm.respond(false)">
            {{ 'common.cancel' | translate }}
          </button>
          <button
            type="button"
            [class]="req.danger ? 'btn-danger' : 'btn-primary'"
            (click)="confirm.respond(true)"
          >
            {{ req.confirmLabel ?? ('common.confirm' | translate) }}
          </button>
        </div>
      </app-modal>
    }
  `,
})
export class ConfirmDialog {
  readonly confirm = inject(ConfirmService);
}
