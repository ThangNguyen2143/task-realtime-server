import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class PermissionService {
  constructor(private readonly db: DatabaseService) {}

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
    const member = await this.db.workspaceMember.findFirst({
      where: {
        userId,
        workspaceId,
      },
      select: {
        id: true,
      },
    });

    return !!member;
  }
}
