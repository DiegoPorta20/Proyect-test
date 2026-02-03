import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SesService } from './ses.service';
import { SesController } from './ses.controller';
import { SentEmail } from '../../entities/sent-email.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([SentEmail]),
  ],
  controllers: [SesController],
  providers: [SesService],
  exports: [SesService],
})
export class SesModule {}
