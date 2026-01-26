import { IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  message: any;

  @IsOptional()
  @IsNumber()
  delaySeconds?: number;

  @IsOptional()
  messageAttributes?: Record<string, any>;
}

export class SendMessageBatchDto {
  @IsArray()
  @IsNotEmpty()
  messages: any[];
}
