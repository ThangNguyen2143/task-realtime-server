import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { TaskStatus } from 'generated/prisma/enums';

export class UpdateStatusTaskDto {
  @ApiProperty({ description: 'Task id to update' })
  @IsNotEmpty()
  task_id: string;
  @ApiProperty({ description: 'Status update' })
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
