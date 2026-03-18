import { ApiProperty } from '@nestjs/swagger';
import { MaxLength, MinLength, IsNotEmpty, IsEmail } from 'class-validator';
export class CreateUserDto {
  @ApiProperty({
    example: 'john_doe',
    description: 'Tên hiển thị',
  })
  @IsNotEmpty()
  @MaxLength(100)
  readonly name_display: string;
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email của người dùng',
  })
  @IsEmail()
  readonly email: string;
  @ApiProperty({ example: 'P@ssw0rd', description: 'Mật khẩu của người dùng' })
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(48)
  readonly password: string;
}
