import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';

interface NavItem {
  path: string;
  labelKey: string;
  icon: string;
  managerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: '📊' },
  { path: '/products', labelKey: 'nav.products', icon: '📦' },
  { path: '/categories', labelKey: 'nav.categories', icon: '🏷️' },
  { path: '/pos', labelKey: 'nav.pos', icon: '🛒' },
  { path: '/sales', labelKey: 'nav.sales', icon: '🧾' },
  { path: '/reports', labelKey: 'nav.reports', icon: '📈', managerOnly: true },
];

@Component({
  selector: 'app-main-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './main-layout.html',
})
export class MainLayout {
  private readonly auth = inject(AuthService);
  readonly language = inject(LanguageService);

  readonly user = this.auth.currentUser;
  readonly sidebarOpen = signal(false);

  readonly navItems = computed(() =>
    NAV_ITEMS.filter((item) => !item.managerOnly || this.auth.isManager()),
  );

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleLanguage(): void {
    this.language.toggle();
  }

  logout(): void {
    this.auth.logout();
  }
}
