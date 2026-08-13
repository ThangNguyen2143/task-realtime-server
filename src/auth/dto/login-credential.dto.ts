import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class LoginCredential {
  /**
   * User email
   */
  @ApiProperty({ example: 'user@gmail.com', description: 'User email' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  readonly email: string;
  /**
   * 4-12 char long password
   */
  @ApiProperty({
    example: 'password123',
    description: 'User password (4-12 characters)',
  })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(4, { message: 'Mật khẩu phải có ít nhất 4 ký tự' })
  @MaxLength(24, { message: 'Mật khẩu không được vượt quá 24 ký tự' })
  readonly password: string;
}
