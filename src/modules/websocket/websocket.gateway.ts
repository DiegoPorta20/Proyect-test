import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { WebsocketMessage } from '../../entities/websocket-message.entity';

@WebSocketGateway({
  cors: {
    origin: '*', // En producción, especifica los orígenes permitidos
    credentials: true,
  },
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('WebsocketGateway');
  private connectedUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor(
    @InjectRepository(WebsocketMessage)
    private websocketMessageRepository: Repository<WebsocketMessage>,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway inicializado');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
    
    // Enviar mensaje de bienvenida
    client.emit('welcome', {
      message: 'Conexión establecida exitosamente',
      socketId: client.id,
    });
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.connectedUsers.delete(client.id);
      this.logger.log(`Usuario ${userId} desconectado`);
    }
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  /**
   * Registrar usuario con su socket ID
   */
  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.connectedUsers.set(client.id, data.userId);
    this.logger.log(`Usuario ${data.userId} registrado con socket ${client.id}`);
    
    return {
      event: 'registered',
      data: {
        userId: data.userId,
        socketId: client.id,
        message: 'Usuario registrado exitosamente',
      },
    };
  }

  /**
   * Enviar mensaje a un usuario específico
   */
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { to: string; message: string; from?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const fromUser = this.connectedUsers.get(client.id);
    
    // Buscar el socket del destinatario
    const recipientSocketId = Array.from(this.connectedUsers.entries()).find(
      ([_, userId]) => userId === data.to,
    )?.[0];

    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('newMessage', {
        from: data.from || fromUser,
        message: data.message,
        timestamp: new Date(),
      });

      // Guardar mensaje en base de datos
      const websocketMessage = this.websocketMessageRepository.create({
        fromUserId: data.from || fromUser,
        toUserId: data.to,
        message: data.message,
        type: 'direct',
        status: 'delivered',
      });
      await this.websocketMessageRepository.save(websocketMessage);

      this.logger.log(`Mensaje enviado de ${fromUser} a ${data.to}`);

      return {
        event: 'messageSent',
        data: { success: true, message: 'Mensaje enviado' },
      };
    } else {
      return {
        event: 'messageError',
        data: { success: false, message: 'Usuario no conectado' },
      };
    }
  }

  /**
   * Broadcast a todos los clientes conectados
   */
  @SubscribeMessage('broadcast')
  handleBroadcast(
    @MessageBody() data: { message: string; type?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const fromUser = this.connectedUsers.get(client.id);

    this.server.emit('broadcastMessage', {
      from: fromUser,
      message: data.message,
      type: data.type || 'info',
      timestamp: new Date(),
    });

    this.logger.log(`Broadcast enviado por ${fromUser}`);

    return {
      event: 'broadcastSent',
      data: { success: true, recipients: this.server.sockets.sockets.size },
    };
  }

  /**
   * Unirse a una sala específica
   */
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.room);
    this.logger.log(`Cliente ${client.id} unido a la sala ${data.room}`);

    // Notificar a otros en la sala
    client.to(data.room).emit('userJoined', {
      userId: this.connectedUsers.get(client.id),
      room: data.room,
    });

    return {
      event: 'joinedRoom',
      data: { room: data.room, message: 'Te has unido a la sala' },
    };
  }

  /**
   * Salir de una sala
   */
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(data.room);
    this.logger.log(`Cliente ${client.id} salió de la sala ${data.room}`);

    // Notificar a otros en la sala
    client.to(data.room).emit('userLeft', {
      userId: this.connectedUsers.get(client.id),
      room: data.room,
    });

    return {
      event: 'leftRoom',
      data: { room: data.room, message: 'Has salido de la sala' },
    };
  }

  /**
   * Enviar mensaje a una sala específica
   */
  @SubscribeMessage('roomMessage')
  handleRoomMessage(
    @MessageBody() data: { room: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const fromUser = this.connectedUsers.get(client.id);

    this.server.to(data.room).emit('roomMessage', {
      room: data.room,
      from: fromUser,
      message: data.message,
      timestamp: new Date(),
    });

    this.logger.log(`Mensaje enviado a la sala ${data.room} por ${fromUser}`);

    return {
      event: 'roomMessageSent',
      data: { success: true, room: data.room },
    };
  }

  /**
   * Métodos públicos para usar desde otros servicios
   */

  /**
   * Enviar notificación a un usuario específico
   */
  sendNotificationToUser(userId: string, notification: any) {
    const socketId = Array.from(this.connectedUsers.entries()).find(
      ([_, id]) => id === userId,
    )?.[0];

    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
      this.logger.log(`Notificación enviada a usuario ${userId}`);
      return true;
    }
    return false;
  }

  /**
   * Enviar notificación a todos los usuarios
   */
  sendNotificationToAll(notification: any) {
    this.server.emit('notification', notification);
    this.logger.log('Notificación enviada a todos los usuarios');
  }

  /**
   * Enviar notificación a una sala
   */
  sendNotificationToRoom(room: string, notification: any) {
    this.server.to(room).emit('notification', notification);
    this.logger.log(`Notificación enviada a la sala ${room}`);
  }

  /**
   * Obtener usuarios conectados
   */
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.values());
  }

  /**
   * Verificar si un usuario está conectado
   */
  isUserConnected(userId: string): boolean {
    return Array.from(this.connectedUsers.values()).includes(userId);
  }
}
