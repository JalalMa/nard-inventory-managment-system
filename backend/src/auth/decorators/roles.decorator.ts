import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to the given roles. Enforced by `RolesGuard`.
 * Absence of this decorator means "any authenticated user".
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
