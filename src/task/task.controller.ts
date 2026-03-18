import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateStatusTaskDto } from './dto/update-status.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

@Controller('/api/task')
@ApiBearerAuth('access-token')
@UseGuards(JwtGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: any) {
    return this.taskService.create(createTaskDto, req.user.userId);
  }

  // Lấy tất cả task theo workspace
  @Get('workspace/:workspaceId')
  findAll(@Param('workspaceId') workspaceId: string, @Req() req: any) {
    return this.taskService.findAll(workspaceId, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.taskService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: any,
  ) {
    return this.taskService.update(id, req.user.userId, updateTaskDto);
  }

  @Patch('status/update')
  updateStatus(@Body() updateStatusDto: UpdateStatusTaskDto, @Req() req: any) {
    return this.taskService.updateStatus(req.user.userId, updateStatusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.taskService.remove(id, req.user.userId);
  }
}
