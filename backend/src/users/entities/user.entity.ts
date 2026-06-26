import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { Sale } from '../../sales/entities/sale.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.EMPLOYEE })
  role: UserRole;

  /**
   * Bcrypt hash of the currently-issued refresh token. Enables refresh-token
   * rotation and server-side invalidation (logout). Null when logged out.
   */
  @Column({ name: 'hashed_refresh_token', type: 'varchar', length: 255, nullable: true })
  hashedRefreshToken: string | null;

  @OneToMany(() => Sale, (sale) => sale.user)
  sales: Sale[];
}
