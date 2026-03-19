import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ description: 'Tên workspace' })
  @IsNotEmpty()
  workspaceName: string;
  @ApiProperty({ description: 'mô tả workspace' })
  @IsNotEmpty()
  description: string;
}
