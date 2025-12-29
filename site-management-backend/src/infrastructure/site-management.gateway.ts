import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class SiteManagementGateway {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('SiteManagementGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Broadcast site updates
  broadcastSiteUpdate(siteData: any) {
    this.server.emit('site-update', siteData);
  }

  // Broadcast cost updates
  broadcastCostUpdate(costData: any) {
    this.server.emit('cost-update', costData);
  }

  // Broadcast warnings
  broadcastWarning(warningData: any) {
    this.server.emit('warning-issued', warningData);
  }

  @SubscribeMessage('join-site')
  handleJoinSite(@ConnectedSocket() client: Socket, @MessageBody() siteId: number) {
    client.join(`site-${siteId}`);
    this.logger.log(`Client ${client.id} joined site ${siteId}`);
    return { status: 'joined', siteId };
  }
}