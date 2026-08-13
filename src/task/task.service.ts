import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateStatusTaskDto } from './dto/update-status.dto';
import { DatabaseService } from '../database/database.service';
import { PermissionService } from '../permission/permission.service';
import { EventPublisherService } from '../realtime/event-publisher.service';
import { TaskStatus } from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';

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
      throw new NotFoundException('Không có quyền truy cập workspace này');
    }

    const task = await this.retryTransaction(() =>
      this.db.$transaction(
        async (tx) => {
          const orderResult = await tx.task.aggregate({
            where: {
              workspaceId: createTaskDto.workspaceId,
              status: TaskStatus.TODO,
            },
            _max: {
              order: true,
            },
          });

          const nextOrder = (orderResult._max.order ?? -1) + 1;

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
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      ),
    );

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
      throw new NotFoundException('Không có quyền truy cập workspace này');
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
        description: true,
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
      throw new NotFoundException(
        'Không tìm thấy nhiệm vụ hoặc không có quyền truy cập',
      );
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
      throw new NotFoundException(
        'Không tìm thấy nhiệm vụ hoặc không có quyền truy cập',
      );
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
      throw new NotFoundException(
        'Không có quyền truy cập hoặc không tìm thấy nhiệm vụ',
      );
    }

    const member = await this.permissionService.getWorkspaceRole(
      userId,
      task.workspaceId,
    );

    if (!member.isMember) {
      throw new NotFoundException(
        'Không có quyền truy cập hoặc không tìm thấy nhiệm vụ',
      );
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
      // Khi chuyển sang cột khác, đặt order của task đang cập nhật tạm thời về -1 để tránh xung đột unique constraint
      await tx.task.update({
        where: { id: task.id },
        data: { order: -1 },
      });
      await tx.$executeRawUnsafe(
        `
        UPDATE "Task"
        SET "order" = "order" - 1
        WHERE "workspaceId" = $1
          AND "status" = $2
          AND "order" > $3
      `,
        task.workspaceId,
        oldStatus,
        oldOrder,
      );
      await tx.$executeRawUnsafe(
        `
  UPDATE "Task"
  SET "order" = "order" + 1
  WHERE id IN (
    SELECT id FROM "Task"
    WHERE "workspaceId" = $1
      AND "status" = $2
      AND "order" >= $3
    ORDER BY "order" DESC
  )
`,
        task.workspaceId,
        newStatus,
        newOrder,
      );

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
      tasks: result.affectedTasks,
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
        order: true,
        status: true,
      },
    });

    if (!task) {
      throw new NotFoundException(
        'Không tìm thấy nhiệm vụ hoặc không có quyền truy cập',
      );
    }

    const member = await this.permissionService.getWorkspaceRole(
      userId,
      task.workspaceId,
    );

    if (!member.isMember) {
      throw new NotFoundException(
        'Không tìm thấy nhiệm vụ hoặc không có quyền truy cập',
      );
    }
    const deletedTask = await this.db.$transaction(
      async (tx) => {
        const task = await tx.task.findUnique({
          where: {
            id: taskId,
          },
          select: {
            id: true,
            title: true,
            workspaceId: true,
            status: true,
            order: true,
          },
        });

        if (!task) {
          throw new NotFoundException(
            'Không tìm thấy nhiệm vụ hoặc không có quyền truy cập',
          );
        }

        // permission check

        await tx.task.delete({
          where: {
            id: task.id,
          },
        });

        await tx.task.updateMany({
          where: {
            workspaceId: task.workspaceId,
            status: task.status,
            order: {
              gt: task.order,
            },
          },
          data: {
            order: {
              decrement: 1,
            },
          },
        });

        return task;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
    this.eventPublisher.publish('task.deleted', {
      workspaceId: deletedTask.workspaceId,
      taskId: deletedTask.id,
    });
    return deletedTask;
  }
  private async retryTransaction<T>(operation: () => Promise<T>): Promise<T> {
    const MAX_RETRIES = 5;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const retryable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2034' || error.code === 'P2002');

        if (retryable && attempt < MAX_RETRIES - 1) {
          continue;
        }

        throw error;
      }
    }

    throw new InternalServerErrorException('Không thể hoàn thành transaction');
  }
}
