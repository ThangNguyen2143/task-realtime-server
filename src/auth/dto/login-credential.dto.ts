import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class LoginCredential {
  /**
   * User email
   */
  @ApiProperty({ example: 'user@gmail.com', description: 'User email' })
  @IsEmail()
  readonly email: string;
  /**
   * 4-12 char long password
   */
  @ApiProperty({
    example: 'password123',
    description: 'User password (4-12 characters)',
  })
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(24)
  readonly password: string;
}
