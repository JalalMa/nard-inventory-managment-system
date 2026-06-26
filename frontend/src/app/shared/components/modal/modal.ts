import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Generic centered modal with backdrop. Content is projected via <ng-content>. */
@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40" (click)="dismiss.emit()"></div>
      <div class="card relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-800">{{ title() }}</h2>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-600"
            (click)="dismiss.emit()"
            aria-label="close"
          >
            ✕
          </button>
        </div>
        <ng-content />
      </div>
    </div>
  `,
})
export class Modal {
  readonly title = input('');
  readonly dismiss = output<void>();
}
