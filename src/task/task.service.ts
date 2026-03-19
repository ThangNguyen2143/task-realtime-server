import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateStatusTaskDto } from './dto/update-status.dto';
import { DatabaseService } from 'src/database/database.service';
import { PermissionService } from 'src/permission/permission.service';
import { EventPublisherService } from 'src/realtime/event-publisher.service';
import { TaskStatus } from 'generated/prisma/enums';

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

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const task = await this.db.$transaction(async (tx) => {
          const nextOrder = await tx.task.count({
            where: {
              workspaceId: createTaskDto.workspaceId,
              status: TaskStatus.TODO,
            },
          });

          return tx.task.create({
            data: {
              title: createTaskDto.title,
              description: createTaskDto.description,
              workspaceId: createTaskDto.workspaceId,
              status: TaskStatus.TODO,
              order: nextOrder,
            },
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              order: true,
              version: true,
              workspaceId: true,
              createAt: true,
              updateAt: true,
            },
          });
        });

        this.eventPublisher.publish('task.created', {
          workspaceId: task.workspaceId,
          task,
        });

        return task;
      } catch (error: any) {
        if (error?.code === 'P2002' && attempt < 2) {
          continue;
        }
        throw error;
      }
    }
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
        order: true,
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
    const result = await this.db.$transaction(async (tx) => {
      const oldStatus = task.status;
      const oldOrder = task.order;
      const newStatus = updateStatus.status;

      const destinationCount = await tx.task.count({
        where: {
          workspaceId: task.workspaceId,
          status: newStatus,
        },
      });

      let newOrder = updateStatus.order;

      if (newOrder < 0) {
        newOrder = 0;
      }

      if (oldStatus === newStatus) {
        const maxIndex = Math.max(destinationCount - 1, 0);
        if (newOrder > maxIndex) {
          newOrder = maxIndex;
        }
      } else {
        if (newOrder > destinationCount) {
          newOrder = destinationCount;
        }
      }

      if (oldStatus === newStatus) {
        if (newOrder === oldOrder) {
          const unchangedTask = await tx.task.findUnique({
            where: { id: task.id },
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              order: true,
              version: true,
              workspaceId: true,
              createAt: true,
              updateAt: true,
            },
          });

          return {
            updatedTask: unchangedTask,
            affectedTasks: unchangedTask ? [unchangedTask] : [],
          };
        }

        if (newOrder < oldOrder) {
          await tx.task.updateMany({
            where: {
              workspaceId: task.workspaceId,
              status: oldStatus,
              order: {
                gte: newOrder,
                lt: oldOrder,
              },
            },
            data: {
              order: {
                increment: 1,
              },
            },
          });
        } else {
          await tx.task.updateMany({
            where: {
              workspaceId: task.workspaceId,
              status: oldStatus,
              order: {
                gt: oldOrder,
                lte: newOrder,
              },
            },
            data: {
              order: {
                decrement: 1,
              },
            },
          });
        }

        const updatedTask = await tx.task.update({
          where: { id: task.id },
          data: {
            status: newStatus,
            order: newOrder,
            version: {
              increment: 1,
            },
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            order: true,
            version: true,
            workspaceId: true,
            createAt: true,
            updateAt: true,
          },
        });

        const minOrder = Math.min(oldOrder, newOrder);
        const maxOrder = Math.max(oldOrder, newOrder);

        const affectedTasks = await tx.task.findMany({
          where: {
            workspaceId: task.workspaceId,
            status: oldStatus,
            order: {
              gte: minOrder,
              lte: maxOrder,
            },
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            order: true,
            version: true,
            workspaceId: true,
            createAt: true,
            updateAt: true,
          },
          orderBy: {
            order: 'asc',
          },
        });

        return {
          updatedTask,
          affectedTasks,
        };
      }

      await tx.task.updateMany({
        where: {
          workspaceId: task.workspaceId,
          status: oldStatus,
          order: {
            gt: oldOrder,
          },
        },
        data: {
          order: {
            decrement: 1,
          },
        },
      });

      await tx.task.updateMany({
        where: {
          workspaceId: task.workspaceId,
          status: newStatus,
          order: {
            gte: newOrder,
          },
        },
        data: {
          order: {
            increment: 1,
          },
        },
      });

      const updatedTask = await tx.task.update({
        where: { id: task.id },
        data: {
          status: newStatus,
          order: newOrder,
          version: {
            increment: 1,
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          order: true,
          version: true,
          workspaceId: true,
          createAt: true,
          updateAt: true,
        },
      });

      const affectedOldColumnTasks = await tx.task.findMany({
        where: {
          workspaceId: task.workspaceId,
          status: oldStatus,
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          order: true,
          version: true,
          workspaceId: true,
          createAt: true,
          updateAt: true,
        },
        orderBy: {
          order: 'asc',
        },
      });

      const affectedNewColumnTasks = await tx.task.findMany({
        where: {
          workspaceId: task.workspaceId,
          status: newStatus,
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          order: true,
          version: true,
          workspaceId: true,
          createAt: true,
          updateAt: true,
        },
        orderBy: {
          order: 'asc',
        },
      });

      const map = new Map<string, any>();
      for (const item of [
        ...affectedOldColumnTasks,
        ...affectedNewColumnTasks,
        updatedTask,
      ]) {
        map.set(item.id, item);
      }

      return {
        updatedTask,
        affectedTasks: Array.from(map.values()),
      };
    });
    this.eventPublisher.publish('task.status-updated', {
      workspaceId: task.workspaceId,
      task: result.affectedTasks,
    });
    return result.updatedTask;
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
