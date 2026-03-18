import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimeService {
  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  @OnEvent('task.created')
  handleTaskCreated(payload: { realtimeId: string; task: any }) {
    this.realtimeGateway.emitToWorkspace(payload.realtimeId, 'created', {
      realtimeId: payload.realtimeId,
      task: payload.task,
    });
  }

  @OnEvent('task.updated')
  handleTaskUpdated(payload: { realtimeId: string; task: any }) {
    this.realtimeGateway.emitToWorkspace(payload.realtimeId, 'updated', {
      realtimeId: payload.realtimeId,
      task: payload.task,
    });
  }

  @OnEvent('task.status-updated')
  handleTaskStatusUpdated(payload: { realtimeId: string; task: any }) {
    this.realtimeGateway.emitToWorkspace(payload.realtimeId, 'statusUpdate', {
      realtimeId: payload.realtimeId,
      task: payload.task,
    });
  }

  @OnEvent('task.deleted')
  handleTaskDeleted(payload: { realtimeId: string; taskId: string }) {
    this.realtimeGateway.emitToWorkspace(payload.realtimeId, 'delete', {
      realtimeId: payload.realtimeId,
      taskId: payload.taskId,
    });
  }
}
