import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SesService } from './ses.service';
import { SesController } from './ses.controller';

@Module({
  imports: [ConfigModule],
  controllers: [SesController],
  providers: [SesService],
  exports: [SesService],
})
export class SesModule {}
