import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { NotificationService, NotificationType } from './notification.service';

class SendNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  data?: any;
}

class BroadcastNotificationDto {
  title: string;
  message: string;
  type?: NotificationType;
  data?: any;
}

class RoomNotificationDto {
  room: string;
  title: string;
  message: string;
  type?: NotificationType;
  data?: any;
}

@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  /**
   * Enviar notificación a un usuario específico
   * POST /notifications/send
   */
  @Post('send')
  async sendNotification(@Body(ValidationPipe) dto: SendNotificationDto) {
    const sent = await this.notificationService.sendToUser(dto.userId, {
      type: dto.type || NotificationType.INFO,
      title: dto.title,
      message: dto.message,
      data: dto.data,
    });

    return {
      statusCode: HttpStatus.OK,
      message: sent
        ? 'Notificación enviada exitosamente'
        : 'Usuario no conectado',
      data: { sent, userId: dto.userId },
    };
  }

  /**
   * Enviar notificación a todos los usuarios
   * POST /notifications/broadcast
   */
  @Post('broadcast')
  async broadcastNotification(
    @Body(ValidationPipe) dto: BroadcastNotificationDto,
  ) {
    this.notificationService.sendToAll({
      type: dto.type || NotificationType.INFO,
      title: dto.title,
      message: dto.message,
      data: dto.data,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Notificación broadcast enviada exitosamente',
    };
  }

  /**
   * Enviar notificación a una sala
   * POST /notifications/room
   */
  @Post('room')
  async sendRoomNotification(@Body(ValidationPipe) dto: RoomNotificationDto) {
    this.notificationService.sendToRoom(dto.room, {
      type: dto.type || NotificationType.INFO,
      title: dto.title,
      message: dto.message,
      data: dto.data,
    });

    return {
      statusCode: HttpStatus.OK,
      message: `Notificación enviada a la sala ${dto.room}`,
    };
  }

  /**
   * Verificar si un usuario está conectado
   * GET /notifications/status/:userId
   */
  @Get('status/:userId')
  async checkUserStatus(@Param('userId') userId: string) {
    const isConnected = this.notificationService.isUserConnected(userId);

    return {
      statusCode: HttpStatus.OK,
      data: {
        userId,
        isConnected,
        status: isConnected ? 'online' : 'offline',
      },
    };
  }

  /**
   * Obtener usuarios conectados
   * GET /notifications/connected
   */
  @Get('connected')
  async getConnectedUsers() {
    const users = this.notificationService.getConnectedUsers();

    return {
      statusCode: HttpStatus.OK,
      message: 'Usuarios conectados obtenidos exitosamente',
      data: {
        count: users.length,
        users,
      },
    };
  }
}
