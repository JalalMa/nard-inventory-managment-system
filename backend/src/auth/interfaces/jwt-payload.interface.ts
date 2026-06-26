import { UserRole } from '../../common/enums/user-role.enum';

/** Claims encoded in both access and refresh JWTs. */
export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}

/** Principal attached to `request.user` after successful authentication. */
export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: UserRole;
}
