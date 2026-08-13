import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { WsException } from '@nestjs/websockets/errors/ws-exception';
import { PayloadTokenDto } from 'src/auth/dto/payload-token.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PermissionService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async getWorkspaceRole(userId: string, workspaceId: string) {
    const member = await this.db.workspaceMember.findFirst({
      where: {
        userId,
        workspaceId,
      },
      select: {
        role: true,
      },
    });

    return {
      isMember: !!member,
      role: member?.role ?? null,
    };
  }

  async isWorkspaceMember(userId: string, workspaceId: string) {
    const member = await this.db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
      select: {
        id: true,
      },
    });

    return !!member;
  }
  async checkAccessTokenToGetUserId(accessToken: string) {
    if (!accessToken) {
      throw new WsException({
        code: 'UNAUTHORIZED',
        message: 'Access token không hợp lệ hoặc đã hết hạn',
      });
    }
    const payload = await this.jwtService.verifyAsync<PayloadTokenDto>(
      accessToken,
      {
        secret: process.env.JWT_SECRET!,
      },
    );

    if (!payload.userId) {
      throw new WsException({
        code: 'UNAUTHORIZED',
        message: 'Token không hợp lệ',
      });
    }

    return payload.userId;
  }
}
