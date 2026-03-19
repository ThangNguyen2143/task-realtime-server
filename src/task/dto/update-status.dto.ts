import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { TaskStatus } from 'generated/prisma/enums';

export class UpdateStatusTaskDto {
  @ApiProperty({ description: 'Task id' })
  @IsNotEmpty()
  task_id: string;
  @ApiProperty({ description: 'Trạng thái của nhiệm vụ' })
  @IsEnum(TaskStatus)
  status: TaskStatus;
  @ApiProperty({ description: 'Thứ tự hiển thị' })
  @IsNumber()
  order: number;
}
