import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { DatabaseService } from 'src/database/database.service';
import { PayloadTokenDto } from 'src/auth/dto/payload-token.dto';
import { WorkspaceRole } from 'generated/prisma/enums';
import { InviteMemberDto } from './dto/invite-member.dto';

@Injectable()
export class WorkspaceService {
  constructor(private db: DatabaseService) {}
  async create(createWorkspaceDto: CreateWorkspaceDto, user: PayloadTokenDto) {
    return this.db.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          workspaceName: createWorkspaceDto.workspaceName,
          description: createWorkspaceDto.description,
          owner: {
            connect: {
              id: user.userId,
            },
          },
          members: {
            create: {
              role: 'OWNER',
              user: {
                connect: {
                  id: user.userId,
                },
              },
              joinAt: new Date(),
            },
          },
        },
        select: {
          id: true,
          workspaceName: true,
          description: true,
          ownerId: true,
          createAt: true,
        },
      });

      return workspace;
    });
  }

  async findAll(userId: string) {
    const listWorkspace = await this.db.workspaceMember.findMany({
      where: {
        userId,
      },
      include: {
        workspace: {
          select: {
            id: true,
            workspaceName: true,
            description: true,
            ownerId: true,
          },
        },
      },
    });
    if (listWorkspace.length == 0) return [];
    return listWorkspace.map((item) => ({
      id: item.workspace.id,
      workspaceName: item.workspace.workspaceName,
      description: item.workspace.description,
      role: item.role,
      joinAt: item.joinAt,
    }));
  }

  async findOne(workSpaceId: string, currentUserId: string) {
    const isMember = await this.checkMember(currentUserId, workSpaceId);
    if (!isMember[0]) {
      throw new NotFoundException();
    }
    const workspaceFound = await this.db.workspace.findUnique({
      where: { id: workSpaceId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
    if (!workspaceFound) throw new NotFoundException();
    const member = workspaceFound.members.map((mem) => {
      return {
        id: mem.id,
        userId: mem.userId,
        workspaceId: mem.workspaceId,
        role: mem.role,
        joinAt: mem.joinAt,
        nameDisplay: mem.user.nameDisplay,
      };
    });
    return { ...workspaceFound, members: member };
  }
  async inviteMember(currentUserId: string, dto: InviteMemberDto) {
    const workspace = await this.db.workspace.findUnique({
      where: { id: dto.workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    const user = await this.db.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const existed = await this.db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: dto.workspaceId,
        },
      },
    });

    if (existed) {
      throw new BadRequestException(
        'Người dùng đã là thành viên của workspace',
      );
    }

    return this.db.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: dto.workspaceId,
        role: WorkspaceRole.MEMBER,
      },
    });
  }
  async update(
    id: string,
    userId: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    const [isMember, role] = await this.checkMember(userId, id);
    if (!isMember) {
      throw new NotFoundException();
    }
    if (role != WorkspaceRole.OWNER) {
      throw new ForbiddenException();
    }
    const hasUpdate = await this.db.workspace.update({
      where: { id },
      data: {
        workspaceName: updateWorkspaceDto.workspaceName,
        description: updateWorkspaceDto.description,
      },
      select: {
        id: true,
        workspaceName: true,
      },
    });
    return hasUpdate;
  }

  async remove(id: string, currentUserId: string) {
    const [isMember, role] = await this.checkMember(currentUserId, id);
    if (!isMember) {
      throw new NotFoundException();
    }
    if (role != WorkspaceRole.OWNER) {
      throw new ForbiddenException();
    }
    return await this.db.workspace.delete({ where: { id } });
  }
  async checkMember(
    userId: string,
    workspaceId: string,
  ): Promise<[boolean, string]> {
    const member = await this.db.workspaceMember.findFirst({
      where: { userId, workspaceId },
    });
    if (!member) return [false, null];
    return [true, member.role];
  }
}
