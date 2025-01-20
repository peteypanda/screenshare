import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';

export class SocketService {
  private static io: SocketIOServer;

  public static getIO(): SocketIOServer {
    if (!SocketService.io) {
      throw new Error('Socket.io not initialized');
    }
    return SocketService.io;
  }

  public static init(httpServer: NetServer): void {
    SocketService.io = new SocketIOServer(httpServer);
  }
}