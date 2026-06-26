import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

/**
 * Injects the authenticated principal (or one of its properties) into a handler.
 * Usage: `@CurrentUser() user: AuthenticatedUser` or `@CurrentUser('userId') id: number`.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
    return data ? request.user?.[data] : request.user;
  },
);
