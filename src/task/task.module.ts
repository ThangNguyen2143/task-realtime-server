import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { PermissionService } from '../permission/permission.service';
import { DatabaseService } from '../database/database.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { JwtService } from '@nestjs/jwt';
import { EventPublisherService } from '../realtime/event-publisher.service';

@Module({
  controllers: [TaskController],
  providers: [
    TaskService,
    PermissionService,
    DatabaseService,
    JwtService,
    EventPublisherService,
  ],
  imports: [RealtimeModule],
})
export class TaskModule {}
