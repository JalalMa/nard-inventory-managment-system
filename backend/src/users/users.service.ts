import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from './entities/user.entity';

interface CreateUserData {
  email: string;
  passwordHash: string;
  role: UserRole;
}

/**
 * Persistence-facing operations for users. Auth-specific logic (token issuance,
 * password verification) lives in AuthService; this service owns the repository.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  create(data: CreateUserData): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async setRefreshTokenHash(userId: number, hashedRefreshToken: string | null): Promise<void> {
    await this.usersRepository.update({ id: userId }, { hashedRefreshToken });
  }
}
