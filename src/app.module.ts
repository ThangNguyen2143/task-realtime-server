import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { TaskModule } from './task/task.module';
import { DatabaseModule } from './database/database.module';
import { RealtimeModule } from './realtime/realtime.module';
import { PermissionService } from './permission/permission.service';
import { JwtModule } from '@nestjs/jwt';
import { PermissionModule } from './permission/permission.module';

@Module({
  imports: [
    AuthModule,
    JwtModule.register({
      signOptions: { expiresIn: '1h' },
    }),
    UserModule,
    WorkspaceModule,
    TaskModule,
    DatabaseModule,
    RealtimeModule,
    PermissionModule,
  ],
  controllers: [AppController],
  providers: [AppService, PermissionService],
})
export class AppModule {}
