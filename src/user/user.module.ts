import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseService } from 'src/database/database.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [UserController],
  providers: [UserService, DatabaseService, JwtService],
})
export class UserModule {}
