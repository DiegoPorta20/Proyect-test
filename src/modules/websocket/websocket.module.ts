import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebsocketGateway } from './websocket.gateway';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { WebsocketMessage } from '../../entities/websocket-message.entity';
import { Notification } from '../../entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebsocketMessage, Notification]),
  ],
  controllers: [NotificationController],
  providers: [WebsocketGateway, NotificationService],
  exports: [WebsocketGateway, NotificationService],
})
export class WebsocketModule {}
