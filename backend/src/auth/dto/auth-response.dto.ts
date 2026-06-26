import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../../users/entities/user.entity';

export class AuthUserDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  static fromEntity(user: User): AuthUserDto {
    return { id: user.id, email: user.email, role: user.role };
  }
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;

  @ApiProperty({ description: 'Short-lived JWT for API access' })
  accessToken: string;

  @ApiProperty({ description: 'Long-lived JWT used to obtain a new access token' })
  refreshToken: string;
}
