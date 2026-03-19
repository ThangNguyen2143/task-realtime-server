import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ description: 'Tiêu đề nhiệm vụ' })
  @IsString()
  title: string;
  @ApiProperty({ description: 'Mô tả nhiệm vụ' })
  @IsOptional()
  @IsString()
  description?: string;
  @ApiProperty({ description: 'Workspace Id' })
  @IsString()
  workspaceId: string;
}
