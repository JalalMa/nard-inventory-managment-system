import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AppConfig } from '../config/configuration';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcryptjs');

const mockedCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
const mockedHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<
    Pick<UsersService, 'findByEmail' | 'findById' | 'setRefreshTokenHash'>
  >;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;

  const buildUser = (overrides: Partial<User> = {}): User => ({
    id: 1,
    email: 'manager@nard.io',
    passwordHash: 'hashed',
    role: UserRole.MANAGER,
    hashedRefreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      setRefreshTokenHash: jest.fn().mockResolvedValue(undefined),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };
    const config = {
      get: jest.fn().mockReturnValue({
        accessSecret: 'access',
        accessExpiresIn: '15m',
        refreshSecret: 'refresh',
        refreshExpiresIn: '7d',
      }),
    } as unknown as ConfigService<AppConfig, true>;

    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      config,
    );
  });

  describe('validateCredentials', () => {
    it('throws when the user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.validateCredentials('x@y.io', 'pw')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws when the password does not match', async () => {
      usersService.findByEmail.mockResolvedValue(buildUser());
      mockedCompare.mockResolvedValue(false as never);
      await expect(service.validateCredentials('manager@nard.io', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns the user on valid credentials', async () => {
      const user = buildUser();
      usersService.findByEmail.mockResolvedValue(user);
      mockedCompare.mockResolvedValue(true as never);
      await expect(service.validateCredentials('manager@nard.io', 'Manager123!')).resolves.toBe(
        user,
      );
    });
  });

  describe('login', () => {
    it('issues a token pair and persists the rotated refresh hash', async () => {
      const user = buildUser();
      usersService.findByEmail.mockResolvedValue(user);
      mockedCompare.mockResolvedValue(true as never);
      mockedHash.mockResolvedValue('hashed.refresh' as never);

      const result = await service.login('manager@nard.io', 'Manager123!');

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.refreshToken).toBe('signed.jwt.token');
      expect(result.user).toEqual({ id: 1, email: 'manager@nard.io', role: UserRole.MANAGER });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(usersService.setRefreshTokenHash).toHaveBeenCalledWith(1, 'hashed.refresh');
    });
  });

  describe('getUserIfRefreshTokenMatches', () => {
    it('throws when no refresh hash is stored', async () => {
      usersService.findById.mockResolvedValue(buildUser({ hashedRefreshToken: null }));
      await expect(service.getUserIfRefreshTokenMatches(1, 'token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns the user when the refresh token matches the stored hash', async () => {
      const user = buildUser({ hashedRefreshToken: 'stored.hash' });
      usersService.findById.mockResolvedValue(user);
      mockedCompare.mockResolvedValue(true as never);
      await expect(service.getUserIfRefreshTokenMatches(1, 'token')).resolves.toBe(user);
    });
  });
});
