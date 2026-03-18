import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
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
import ResponseHelper from 'src/helper/ResponseModel';

@Controller('/api/task')
@ApiBearerAuth('access-token')
@UseGuards(JwtGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @Req() req: any) {
    try {
      const res = await this.taskService.create(createTaskDto, req.user.userId);
      return ResponseHelper.ResponseSuccess(res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // Lấy tất cả task theo workspace
  @Get('workspace/:workspaceId')
  async findAll(@Param('workspaceId') workspaceId: string, @Req() req: any) {
    try {
      const res = await this.taskService.findAll(workspaceId, req.user.userId);
      return ResponseHelper.ResponseSuccess(res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    try {
      const res = await this.taskService.findOne(id, req.user.userId);
      return ResponseHelper.ResponseSuccess(res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: any,
  ) {
    try {
      const res = await this.taskService.update(
        id,
        req.user.userId,
        updateTaskDto,
      );
      return ResponseHelper.ResponseSuccess(res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch('status/update')
  async updateStatus(
    @Body() updateStatusDto: UpdateStatusTaskDto,
    @Req() req: any,
  ) {
    try {
      const res = await this.taskService.updateStatus(
        req.user.userId,
        updateStatusDto,
      );
      return ResponseHelper.ResponseSuccess(res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    try {
      const res = await this.taskService.remove(id, req.user.userId);
      return ResponseHelper.ResponseSuccess(res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
