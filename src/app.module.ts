import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { S3Module } from './modules/s3/s3.module';
import { SqsModule } from './modules/sqs/sqs.module';
import { SesModule } from './modules/ses/ses.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import awsConfig from './config/aws.config';
import databaseConfig from './config/database.config';
import { UploadedFile } from './entities/uploaded-file.entity';
import { SentEmail } from './entities/sent-email.entity';
import { SqsMessage } from './entities/sqs-message.entity';
import { WebsocketMessage } from './entities/websocket-message.entity';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [awsConfig, databaseConfig],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [UploadedFile, SentEmail, SqsMessage, WebsocketMessage, Notification],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([UploadedFile, SentEmail, SqsMessage, WebsocketMessage, Notification]),
    WebsocketModule,
    S3Module,
    SqsModule,
    SesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
