import { Module } from '@nestjs/common';
import { RealtimeService } from './realtime.service';
import { RealtimeGateway } from './realtime.gateway';
import { EventPublisherService } from './event-publisher.service';
import { PermissionService } from 'src/permission/permission.service';
import { DatabaseService } from 'src/database/database.service';

@Module({
  imports: [EventPublisherService],
  providers: [
    RealtimeGateway,
    RealtimeService,
    EventPublisherService,
    PermissionService,
    DatabaseService,
  ],
})
export class RealtimeModule {}
