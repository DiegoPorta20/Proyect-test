import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SqsService } from './sqs.service';
import { SqsController } from './sqs.controller';
import { SqsMessage } from '../../entities/sqs-message.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([SqsMessage]),
  ],
  controllers: [SqsController],
  providers: [SqsService],
  exports: [SqsService],
})
export class SqsModule {}
