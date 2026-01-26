import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { S3Module } from './modules/s3/s3.module';
import { SqsModule } from './modules/sqs/sqs.module';
import { SesModule } from './modules/ses/ses.module';
import awsConfig from './config/aws.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [awsConfig],
      envFilePath: '.env',
    }),
    S3Module,
    SqsModule,
    SesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
