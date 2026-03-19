import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ description: 'workspace id' })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;
  @ApiProperty({ description: 'email invite' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
