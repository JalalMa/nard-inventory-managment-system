import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AppConfig } from '../config/configuration';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  /** Verifies email + password, returning the user or throwing 401. */
  async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async login(email: string, password: string): Promise<AuthResponseDto> {
    const user = await this.validateCredentials(email, password);
    return this.issueTokens(user);
  }

  /** Rotates tokens: only callable with a refresh token matching the stored hash. */
  async refresh(user: User): Promise<AuthResponseDto> {
    return this.issueTokens(user);
  }

  async logout(userId: number): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  /**
   * Used by the refresh strategy: confirms the presented refresh token matches
   * the rotated hash persisted for the user, defeating replay of old tokens.
   */
  async getUserIfRefreshTokenMatches(userId: number, refreshToken: string): Promise<User> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Access denied');
    }
    const matches = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!matches) {
      throw new UnauthorizedException('Access denied');
    }
    return user;
  }

  /** Hash a plaintext password — used by the seed and any user-creation flow. */
  static hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  private async issueTokens(user: User): Promise<AuthResponseDto> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const jwt = this.config.get('jwt', { infer: true });

    const accessOptions: JwtSignOptions = {
      secret: jwt.accessSecret,
      expiresIn: jwt.accessExpiresIn as JwtSignOptions['expiresIn'],
    };
    const refreshOptions: JwtSignOptions = {
      secret: jwt.refreshSecret,
      expiresIn: jwt.refreshExpiresIn as JwtSignOptions['expiresIn'],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, accessOptions),
      this.jwtService.signAsync(payload, refreshOptions),
    ]);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.usersService.setRefreshTokenHash(user.id, hashedRefreshToken);

    return { user: AuthUserDto.fromEntity(user), accessToken, refreshToken };
  }
}
