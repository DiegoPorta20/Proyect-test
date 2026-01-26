import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SqsService } from './sqs.service';
import { SqsController } from './sqs.controller';

@Module({
  imports: [ConfigModule],
  controllers: [SqsController],
  providers: [SqsService],
  exports: [SqsService],
})
export class SqsModule {}
