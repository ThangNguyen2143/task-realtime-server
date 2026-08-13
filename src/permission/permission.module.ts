import { Module } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [DatabaseService, JwtService],
})
export class PermissionModule {}
