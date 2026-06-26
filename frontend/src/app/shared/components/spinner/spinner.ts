import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Inline loading spinner. Size in pixels via the `size` input. */
@Component({
  selector: 'app-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-block animate-spin rounded-full border-2 border-current border-t-transparent text-primary-600"
      [style.width.px]="size()"
      [style.height.px]="size()"
      role="status"
      aria-label="loading"
    ></span>
  `,
})
export class Spinner {
  readonly size = input(20);
}
