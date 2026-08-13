import { Module } from '@nestjs/common';
import { RealtimeService } from './realtime.service';
import { RealtimeGateway } from './realtime.gateway';
import { EventPublisherService } from './event-publisher.service';
import { PermissionService } from '../permission/permission.service';
import { DatabaseModule } from '../database/database.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [DatabaseModule],
  providers: [
    RealtimeGateway,
    RealtimeService,
    EventPublisherService,
    PermissionService,
    JwtService,
  ],
  exports: [RealtimeGateway, RealtimeService, EventPublisherService],
})
export class RealtimeModule {}
