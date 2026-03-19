import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTaskDto {
  @ApiProperty({ description: 'Tiêu đề' })
  @IsOptional()
  @IsString()
  title?: string;
  @ApiProperty({ description: 'Mô tả' })
  @IsOptional()
  @IsString()
  description?: string;
}
