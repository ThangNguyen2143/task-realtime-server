import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RealtimeGateway } from './realtime.gateway';
import { Task } from 'generated/prisma/client';

@Injectable()
export class RealtimeService {
  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  @OnEvent('task.created')
  handleTaskCreated(payload: { workspaceId: string; task: Task }) {
    this.realtimeGateway.emitToWorkspace(payload.workspaceId, 'created', {
      workspaceId: payload.workspaceId,
      task: payload.task,
    });
  }

  @OnEvent('task.updated')
  handleTaskUpdated(payload: { workspaceId: string; task: Task }) {
    this.realtimeGateway.emitToWorkspace(payload.workspaceId, 'updated', {
      workspaceId: payload.workspaceId,
      task: payload.task,
    });
  }

  @OnEvent('task.status-updated')
  handleTaskStatusUpdated(payload: { workspaceId: string; tasks: Task[] }) {
    this.realtimeGateway.emitToWorkspace(payload.workspaceId, 'statusUpdate', {
      workspaceId: payload.workspaceId,
      tasks: payload.tasks,
    });
  }

  @OnEvent('task.deleted')
  handleTaskDeleted(payload: { workspaceId: string; taskId: string }) {
    this.realtimeGateway.emitToWorkspace(payload.workspaceId, 'delete', {
      workspaceId: payload.workspaceId,
      taskId: payload.taskId,
    });
  }
}
