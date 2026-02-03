import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebsocketGateway } from './websocket.gateway';
import { Notification as NotificationEntity } from '../../entities/notification.entity';

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  FILE_UPLOADED = 'file_uploaded',
  EMAIL_SENT = 'email_sent',
  MESSAGE_RECEIVED = 'message_received',
}

export interface Notification {
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  timestamp?: Date;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private websocketGateway: WebsocketGateway,
    @InjectRepository(NotificationEntity)
    private notificationRepository: Repository<NotificationEntity>,
  ) {}

  /**
   * Enviar notificación a un usuario específico
   */
  async sendToUser(userId: string, notification: Notification): Promise<boolean> {
    notification.timestamp = new Date();
    
    const sent = this.websocketGateway.sendNotificationToUser(
      userId,
      notification,
    );

    // Guardar notificación en base de datos
    const notificationEntity = this.notificationRepository.create({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data ? JSON.stringify(notification.data) : null,
      status: sent ? 'delivered' : 'pending',
    });
    await this.notificationRepository.save(notificationEntity);

    if (sent) {
      this.logger.log(
        `Notificación enviada a usuario ${userId}: ${notification.title}`,
      );
    } else {
      this.logger.warn(`Usuario ${userId} no está conectado`);
    }

    return sent;
  }

  /**
   * Enviar notificación a todos los usuarios conectados
   */
  sendToAll(notification: Notification): void {
    notification.timestamp = new Date();
    
    this.websocketGateway.sendNotificationToAll(notification);
    
    this.logger.log(
      `Notificación broadcast enviada: ${notification.title}`,
    );
  }

  /**
   * Enviar notificación a una sala específica
   */
  sendToRoom(room: string, notification: Notification): void {
    notification.timestamp = new Date();
    
    this.websocketGateway.sendNotificationToRoom(room, notification);
    
    this.logger.log(
      `Notificación enviada a sala ${room}: ${notification.title}`,
    );
  }

  /**
   * Notificación de archivo subido
   */
  async notifyFileUploaded(
    userId: string,
    fileName: string,
    fileUrl: string,
  ): Promise<boolean> {
    return await this.sendToUser(userId, {
      type: NotificationType.FILE_UPLOADED,
      title: 'Archivo subido',
      message: `El archivo "${fileName}" se subió exitosamente`,
      data: {
        fileName,
        fileUrl,
      },
    });
  }

  /**
   * Notificación de correo enviado
   */
  async notifyEmailSent(
    userId: string,
    recipient: string,
    subject: string,
  ): Promise<boolean> {
    return await this.sendToUser(userId, {
      type: NotificationType.EMAIL_SENT,
      title: 'Correo enviado',
      message: `Correo enviado exitosamente a ${recipient}`,
      data: {
        recipient,
        subject,
      },
    });
  }

  /**
   * Notificación de mensaje recibido
   */
  async notifyMessageReceived(
    userId: string,
    from: string,
    preview: string,
  ): Promise<boolean> {
    return await this.sendToUser(userId, {
      type: NotificationType.MESSAGE_RECEIVED,
      title: 'Nuevo mensaje',
      message: `Mensaje de ${from}`,
      data: {
        from,
        preview,
      },
    });
  }

  /**
   * Notificación de éxito
   */
  async notifySuccess(userId: string, title: string, message: string): Promise<boolean> {
    return await this.sendToUser(userId, {
      type: NotificationType.SUCCESS,
      title,
      message,
    });
  }

  /**
   * Notificación de error
   */
  async notifyError(userId: string, title: string, message: string): Promise<boolean> {
    return await this.sendToUser(userId, {
      type: NotificationType.ERROR,
      title,
      message,
    });
  }

  /**
   * Notificación de advertencia
   */
  async notifyWarning(userId: string, title: string, message: string): Promise<boolean> {
    return await this.sendToUser(userId, {
      type: NotificationType.WARNING,
      title,
      message,
    });
  }

  /**
   * Notificación informativa
   */
  async notifyInfo(userId: string, title: string, message: string): Promise<boolean> {
    return await this.sendToUser(userId, {
      type: NotificationType.INFO,
      title,
      message,
    });
  }

  /**
   * Verificar si un usuario está conectado
   */
  isUserConnected(userId: string): boolean {
    return this.websocketGateway.isUserConnected(userId);
  }

  /**
   * Obtener lista de usuarios conectados
   */
  getConnectedUsers(): string[] {
    return this.websocketGateway.getConnectedUsers();
  }
}
