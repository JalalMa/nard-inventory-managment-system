import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../enums/user-role.enum';
import { AuthService } from '../services/auth.service';

/**
 * Restricts a route to specific roles. Configure via route data:
 * `{ canActivate: [roleGuard], data: { roles: [UserRole.MANAGER] } }`.
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const roles = (route.data?.['roles'] as UserRole[] | undefined) ?? [];
  const user = auth.currentUser();

  if (!user) {
    return router.parseUrl('/auth/login');
  }
  if (roles.length === 0 || roles.includes(user.role)) {
    return true;
  }
  return router.parseUrl('/');
};
