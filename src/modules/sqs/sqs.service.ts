import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  GetQueueAttributesCommand,
  SendMessageBatchCommand,
} from '@aws-sdk/client-sqs';

export interface SQSMessage {
  id: string;
  body: any;
  receiptHandle: string;
  attributes?: any;
}

@Injectable()
export class SqsService {
  private readonly logger = new Logger(SqsService.name);
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('aws.region');
    const accessKeyId = this.configService.get<string>('aws.accessKeyId');
    const secretAccessKey = this.configService.get<string>('aws.secretAccessKey');
    const queueUrl = this.configService.get<string>('aws.sqs.queueUrl');

    if (!region || !accessKeyId || !secretAccessKey || !queueUrl) {
      throw new Error('AWS SQS configuration is missing. Please check your environment variables.');
    }

    this.sqsClient = new SQSClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.queueUrl = queueUrl;
  }

  /**
   * Envía un mensaje a la cola SQS
   */
  async sendMessage(
    messageBody: any,
    delaySeconds?: number,
    messageAttributes?: Record<string, any>,
  ): Promise<string> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(messageBody),
        DelaySeconds: delaySeconds,
        MessageAttributes: messageAttributes,
      });

      const response = await this.sqsClient.send(command);
      
      this.logger.log(`Mensaje enviado exitosamente. MessageId: ${response.MessageId}`);
      
      return response.MessageId || '';
    } catch (error) {
      this.logger.error(
        `Error al enviar mensaje a SQS: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Envía múltiples mensajes en lote (hasta 10 mensajes)
   */
  async sendMessageBatch(messages: any[]): Promise<void> {
    try {
      const entries = messages.map((message, index) => ({
        Id: `msg-${index}`,
        MessageBody: JSON.stringify(message),
      }));

      const command = new SendMessageBatchCommand({
        QueueUrl: this.queueUrl,
        Entries: entries,
      });

      const response = await this.sqsClient.send(command);
      
      this.logger.log(
        `${response.Successful?.length || 0} mensajes enviados exitosamente`,
      );
      
      if (response.Failed && response.Failed.length > 0) {
        this.logger.warn(
          `${response.Failed.length} mensajes fallaron:`,
          response.Failed,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error al enviar mensajes en lote: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Recibe mensajes de la cola SQS
   */
  async receiveMessages(
    maxMessages: number = 1,
    waitTimeSeconds: number = 0,
  ): Promise<SQSMessage[]> {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: maxMessages,
        WaitTimeSeconds: waitTimeSeconds, // Long polling si > 0
        MessageAttributeNames: ['All'],
      });

      const response = await this.sqsClient.send(command);

      if (!response.Messages || response.Messages.length === 0) {
        this.logger.log('No hay mensajes disponibles en la cola');
        return [];
      }

      const messages: SQSMessage[] = response.Messages.map((msg) => ({
        id: msg.MessageId || '',
        body: JSON.parse(msg.Body || '{}'),
        receiptHandle: msg.ReceiptHandle || '',
        attributes: msg.MessageAttributes,
      }));

      this.logger.log(`${messages.length} mensajes recibidos de la cola`);

      return messages;
    } catch (error) {
      this.logger.error(
        `Error al recibir mensajes de SQS: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Elimina un mensaje de la cola después de procesarlo
   */
  async deleteMessage(receiptHandle: string): Promise<void> {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      });

      await this.sqsClient.send(command);
      
      this.logger.log('Mensaje eliminado exitosamente de la cola');
    } catch (error) {
      this.logger.error(
        `Error al eliminar mensaje de SQS: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Obtiene atributos de la cola (número de mensajes, etc.)
   */
  async getQueueAttributes(): Promise<any> {
    try {
      const command = new GetQueueAttributesCommand({
        QueueUrl: this.queueUrl,
        AttributeNames: ['All'],
      });

      const response = await this.sqsClient.send(command);
      
      return response.Attributes;
    } catch (error) {
      this.logger.error(
        `Error al obtener atributos de la cola: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Procesa mensajes con callback automático (incluye eliminación)
   */
  async processMessages(
    processorFn: (message: any) => Promise<void>,
    maxMessages: number = 10,
  ): Promise<void> {
    const messages = await this.receiveMessages(maxMessages, 20);

    for (const message of messages) {
      try {
        await processorFn(message.body);
        await this.deleteMessage(message.receiptHandle);
        this.logger.log(`Mensaje procesado y eliminado: ${message.id}`);
      } catch (error) {
        this.logger.error(
          `Error al procesar mensaje ${message.id}: ${error.message}`,
        );
        // El mensaje permanecerá en la cola y será reintentado
      }
    }
  }
}
