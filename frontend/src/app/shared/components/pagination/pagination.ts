import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PaginationMeta } from '../../../core/models/pagination.model';

/** Server-side pagination control driven by the backend's pagination meta. */
@Component({
  selector: 'app-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    @if (meta(); as m) {
      <div class="flex items-center justify-between gap-4 px-1 py-3 text-sm text-slate-600">
        <span>{{ rangeStart() }}–{{ rangeEnd() }} {{ 'common.of' | translate }} {{ m.total }}</span>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="btn-secondary px-3 py-1"
            [disabled]="m.page <= 1"
            (click)="pageChange.emit(m.page - 1)"
          >
            ‹
          </button>
          <span class="px-2">{{ m.page }} / {{ m.totalPages || 1 }}</span>
          <button
            type="button"
            class="btn-secondary px-3 py-1"
            [disabled]="m.page >= m.totalPages"
            (click)="pageChange.emit(m.page + 1)"
          >
            ›
          </button>
        </div>
      </div>
    }
  `,
})
export class Pagination {
  readonly meta = input<PaginationMeta | null>(null);
  readonly pageChange = output<number>();

  readonly rangeStart = computed(() => {
    const m = this.meta();
    return m && m.total > 0 ? (m.page - 1) * m.limit + 1 : 0;
  });

  readonly rangeEnd = computed(() => {
    const m = this.meta();
    return m ? Math.min(m.page * m.limit, m.total) : 0;
  });
}
