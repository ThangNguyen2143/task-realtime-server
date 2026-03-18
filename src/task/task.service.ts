import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateStatusTaskDto } from './dto/update-status.dto';
import { DatabaseService } from 'src/database/database.service';
import { PermissionService } from 'src/permission/permission.service';
import { EventPublisherService } from 'src/realtime/event-publisher.service';

@Injectable()
export class TaskService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly db: DatabaseService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string) {
    const member = await this.permissionService.getWorkspaceRole(
      userId,
      createTaskDto.workspaceId,
    );

    if (!member.isMember) {
      throw new NotFoundException('Workspace not found');
    }

    const task = await this.db.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        workspaceId: createTaskDto.workspaceId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        version: true,
        workspaceId: true,
        createAt: true,
        updateAt: true,
      },
    });
    this.eventPublisher.publish('task.created', {
      workspaceId: task.workspaceId,
      task,
    });
    return task;
  }

  async findAll(workspaceId: string, userId: string) {
    const member = await this.permissionService.getWorkspaceRole(
      userId,
      workspaceId,
    );

    if (!member.isMember) {
      throw new NotFoundException('Workspace not found');
    }

    return this.db.task.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        status: true,
        version: true,
      },
    });
  }

  async findOne(taskId: string, userId: string) {
    const task = await this.db.task.findFirst({
      where: {
        id: taskId,
        workspace: {
          members: {
            some: {
              userId, // Check user in workspace thought member
            },
          },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        version: true,
        workspaceId: true,
        createAt: true,
        updateAt: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }
  async update(taskId: string, userId: string, updateTaskDto: UpdateTaskDto) {
    const task = await this.db.task.findFirst({
      where: {
        id: taskId,
        workspace: {
          members: {
            some: {
              userId, // Check user in workspace thought member
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const updatedTask = await this.db.task.update({
      where: { id: taskId },
      data: {
        title: updateTaskDto.title,
        description: updateTaskDto.description,
        version: {
          increment: 1,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        version: true,
        workspaceId: true,
        createAt: true,
        updateAt: true,
      },
    });
    this.eventPublisher.publish('task.updated', {
      workspaceId: updatedTask.workspaceId,
      task: updatedTask,
    });
    return updatedTask;
  }

  async updateStatus(userId: string, updateStatus: UpdateStatusTaskDto) {
    const task = await this.db.task.findUnique({
      where: { id: updateStatus.task_id },
      select: {
        id: true,
        title: true,
        workspaceId: true,
        status: true,
        version: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const member = await this.permissionService.getWorkspaceRole(
      userId,
      task.workspaceId,
    );

    if (!member.isMember) {
      throw new NotFoundException('Task not found');
    }

    const updatedTask = await this.db.task.update({
      where: { id: updateStatus.task_id },
      data: {
        status: updateStatus.status,
        version: {
          increment: 1,
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        version: true,
        workspaceId: true,
        updateAt: true,
      },
    });
    this.eventPublisher.publish('task.status-updated', {
      workspaceId: updatedTask.workspaceId,
      task: updatedTask,
    });
    return updatedTask;
  }

  async remove(taskId: string, userId: string) {
    const task = await this.db.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        workspaceId: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const member = await this.permissionService.getWorkspaceRole(
      userId,
      task.workspaceId,
    );

    if (!member.isMember) {
      throw new NotFoundException('Task not found');
    }
    const deletedTask = await this.db.task.delete({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        workspaceId: true,
      },
    });
    this.eventPublisher.publish('task.deleted', {
      workspaceId: deletedTask.workspaceId,
      taskId: deletedTask.id,
    });
    return deletedTask;
  }
}
