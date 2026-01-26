import {
  Controller,
  Post,
  Get,
  Body,
  HttpStatus,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { SqsService } from './sqs.service';
import { SendMessageDto, SendMessageBatchDto } from './dto/sqs.dto';

@Controller('sqs')
export class SqsController {
  constructor(private readonly sqsService: SqsService) {}

  /**
   * Endpoint para enviar un mensaje a la cola
   * POST /sqs/send
   */
  @Post('send')
  async sendMessage(@Body(ValidationPipe) dto: SendMessageDto) {
    const messageId = await this.sqsService.sendMessage(
      dto.message,
      dto.delaySeconds,
      dto.messageAttributes,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Mensaje enviado exitosamente a SQS',
      data: { messageId },
    };
  }

  /**
   * Endpoint para enviar múltiples mensajes
   * POST /sqs/send-batch
   */
  @Post('send-batch')
  async sendMessageBatch(@Body(ValidationPipe) dto: SendMessageBatchDto) {
    await this.sqsService.sendMessageBatch(dto.messages);

    return {
      statusCode: HttpStatus.OK,
      message: 'Mensajes enviados exitosamente a SQS',
    };
  }

  /**
   * Endpoint para recibir mensajes de la cola
   * GET /sqs/receive
   */
  @Get('receive')
  async receiveMessages(
    @Query('maxMessages') maxMessages?: number,
    @Query('waitTimeSeconds') waitTimeSeconds?: number,
  ) {
    const messages = await this.sqsService.receiveMessages(
      maxMessages ? parseInt(maxMessages.toString()) : 1,
      waitTimeSeconds ? parseInt(waitTimeSeconds.toString()) : 0,
    );

    return {
      statusCode: HttpStatus.OK,
      message: `${messages.length} mensajes recibidos`,
      data: messages,
    };
  }

  /**
   * Endpoint para obtener atributos de la cola
   * GET /sqs/attributes
   */
  @Get('attributes')
  async getQueueAttributes() {
    const attributes = await this.sqsService.getQueueAttributes();

    return {
      statusCode: HttpStatus.OK,
      message: 'Atributos de la cola obtenidos exitosamente',
      data: attributes,
    };
  }
}
