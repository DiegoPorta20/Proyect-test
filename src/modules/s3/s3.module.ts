import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { S3Service } from './s3.service';
import { S3Controller } from './s3.controller';
import { WebsocketModule } from '../websocket/websocket.module';
import { UploadedFile } from '../../entities/uploaded-file.entity';

@Module({
  imports: [ConfigModule, WebsocketModule, TypeOrmModule.forFeature([UploadedFile])],
  controllers: [S3Controller],
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {}
