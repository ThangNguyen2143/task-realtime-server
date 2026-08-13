import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PermissionService } from '../permission/permission.service';

@WebSocketGateway({
  cors: true,
})
export class RealtimeGateway {
  @WebSocketServer()
  server: Server;
  constructor(private readonly permissionService: PermissionService) {}
  private getWorkspaceRoom(workspaceId: string) {
    return `workspace:${workspaceId}`;
  }
  // Client join vào workspace (room)
  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() body: { workspaceId: string; accessToken: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = await this.permissionService.checkAccessTokenToGetUserId(
      body.accessToken,
    );
    const isMember = await this.permissionService.isWorkspaceMember(
      userId,
      body.workspaceId,
    );

    if (!isMember) {
      throw new WsException({
        code: 'FORBIDDEN',
        message: 'You are not a member of this workspace',
      });
    }

    const room = this.getWorkspaceRoom(body.workspaceId);
    await client.join(room);

    client.emit('join-room-success', {
      workspaceId: body.workspaceId,
      room,
    });
  }

  emitToWorkspace(workspaceId: string, event: string, payload: any) {
    this.server.to(this.getWorkspaceRoom(workspaceId)).emit(event, payload);
  }
}
