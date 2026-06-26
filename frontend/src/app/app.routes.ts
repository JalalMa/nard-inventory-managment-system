import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/enums/user-role.enum';

const placeholder = () =>
  import('./shared/components/coming-soon/coming-soon').then((m) => m.ComingSoon);

export const routes: Routes = [
  {
    path: 'auth/login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      // Replaced by their real feature components in later steps.
      { path: 'products', loadComponent: placeholder },
      { path: 'categories', loadComponent: placeholder },
      { path: 'pos', loadComponent: placeholder },
      { path: 'sales', loadComponent: placeholder },
      {
        path: 'reports',
        canActivate: [roleGuard],
        data: { roles: [UserRole.MANAGER] },
        loadComponent: placeholder,
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
