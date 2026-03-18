import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { DatabaseService } from 'src/database/database.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [WorkspaceController],
  providers: [WorkspaceService, DatabaseService, JwtService],
})
export class WorkspaceModule {}
