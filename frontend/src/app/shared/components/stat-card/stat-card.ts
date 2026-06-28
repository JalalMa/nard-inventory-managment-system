import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Compact KPI card for dashboards. */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card flex items-center gap-4 p-5">
      <div
        class="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
        [class]="iconClass()"
      >
        {{ icon() }}
      </div>
      <div class="min-w-0">
        <p class="truncate text-sm text-slate-500">{{ label() }}</p>
        <p class="text-2xl font-bold text-[#222756]">{{ value() }}</p>
      </div>
    </div>
  `,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string | number | null>();
  readonly icon = input('•');
  readonly iconClass = input('bg-primary-50 text-primary-600');
}
