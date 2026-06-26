import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'manager@nard.io' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Manager123!', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
