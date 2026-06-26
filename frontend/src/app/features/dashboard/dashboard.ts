import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

/** Placeholder dashboard — metrics and charts are added in a later step. */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <section class="space-y-2">
      <h1 class="text-2xl font-bold text-slate-800">{{ 'nav.dashboard' | translate }}</h1>
      <p class="text-slate-600">
        {{ 'dashboard.welcome' | translate }}, <strong>{{ auth.currentUser()?.email }}</strong>
      </p>
      <div class="card mt-4 p-6 text-slate-500">{{ 'common.comingSoon' | translate }}</div>
    </section>
  `,
})
export class Dashboard {
  readonly auth = inject(AuthService);
}
