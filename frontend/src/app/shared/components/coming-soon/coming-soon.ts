import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** Temporary placeholder for feature pages built in later steps. */
@Component({
  selector: 'app-coming-soon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <div class="card flex h-64 items-center justify-center text-slate-500">
      {{ 'common.comingSoon' | translate }}
    </div>
  `,
})
export class ComingSoon {}
