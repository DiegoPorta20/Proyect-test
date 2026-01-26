import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SESClient,
  SendEmailCommand,
  SendTemplatedEmailCommand,
  CreateTemplateCommand,
  UpdateTemplateCommand,
  DeleteTemplateCommand,
  ListTemplatesCommand,
  GetTemplateCommand,
} from '@aws-sdk/client-ses';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
}

export interface TemplatedEmailOptions {
  to: string | string[];
  templateName: string;
  templateData: Record<string, any>;
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
}

export interface EmailTemplate {
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

@Injectable()
export class SesService {
  private readonly logger = new Logger(SesService.name);
  private readonly sesClient: SESClient;
  private readonly fromEmail: string;
  private readonly configurationSet?: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('aws.region');
    const accessKeyId = this.configService.get<string>('aws.accessKeyId');
    const secretAccessKey = this.configService.get<string>('aws.secretAccessKey');
    const fromEmail = this.configService.get<string>('aws.ses.fromEmail');

    if (!region || !accessKeyId || !secretAccessKey || !fromEmail) {
      throw new Error('AWS SES configuration is missing. Please check your environment variables.');
    }

    this.sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.fromEmail = fromEmail;
    this.configurationSet = this.configService.get<string>(
      'aws.ses.configurationSet',
    );
  }

  /**
   * Envía un correo electrónico simple
   */
  async sendEmail(options: EmailOptions): Promise<string> {
    try {
      const toAddresses = Array.isArray(options.to)
        ? options.to
        : [options.to];

      const command = new SendEmailCommand({
        Source: this.fromEmail,
        Destination: {
          ToAddresses: toAddresses,
          CcAddresses: options.cc,
          BccAddresses: options.bcc,
        },
        Message: {
          Subject: {
            Data: options.subject,
            Charset: 'UTF-8',
          },
          Body: options.isHtml
            ? {
                Html: {
                  Data: options.body,
                  Charset: 'UTF-8',
                },
              }
            : {
                Text: {
                  Data: options.body,
                  Charset: 'UTF-8',
                },
              },
        },
        ReplyToAddresses: options.replyTo,
        ConfigurationSetName: this.configurationSet,
      });

      const response = await this.sesClient.send(command);

      this.logger.log(
        `Correo enviado exitosamente. MessageId: ${response.MessageId}`,
      );

      return response.MessageId || '';
    } catch (error) {
      this.logger.error(
        `Error al enviar correo: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Envía un correo usando una plantilla
   */
  async sendTemplatedEmail(options: TemplatedEmailOptions): Promise<string> {
    try {
      const toAddresses = Array.isArray(options.to)
        ? options.to
        : [options.to];

      const command = new SendTemplatedEmailCommand({
        Source: this.fromEmail,
        Destination: {
          ToAddresses: toAddresses,
          CcAddresses: options.cc,
          BccAddresses: options.bcc,
        },
        Template: options.templateName,
        TemplateData: JSON.stringify(options.templateData),
        ReplyToAddresses: options.replyTo,
        ConfigurationSetName: this.configurationSet,
      });

      const response = await this.sesClient.send(command);

      this.logger.log(
        `Correo con plantilla enviado exitosamente. MessageId: ${response.MessageId}`,
      );

      return response.MessageId || '';
    } catch (error) {
      this.logger.error(
        `Error al enviar correo con plantilla: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Crea una plantilla de correo en SES
   */
  async createTemplate(template: EmailTemplate): Promise<void> {
    try {
      const command = new CreateTemplateCommand({
        Template: {
          TemplateName: template.name,
          SubjectPart: template.subject,
          HtmlPart: template.htmlBody,
          TextPart: template.textBody,
        },
      });

      await this.sesClient.send(command);

      this.logger.log(`Plantilla creada exitosamente: ${template.name}`);
    } catch (error) {
      this.logger.error(
        `Error al crear plantilla: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Actualiza una plantilla de correo existente
   */
  async updateTemplate(template: EmailTemplate): Promise<void> {
    try {
      const command = new UpdateTemplateCommand({
        Template: {
          TemplateName: template.name,
          SubjectPart: template.subject,
          HtmlPart: template.htmlBody,
          TextPart: template.textBody,
        },
      });

      await this.sesClient.send(command);

      this.logger.log(`Plantilla actualizada exitosamente: ${template.name}`);
    } catch (error) {
      this.logger.error(
        `Error al actualizar plantilla: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Elimina una plantilla de correo
   */
  async deleteTemplate(templateName: string): Promise<void> {
    try {
      const command = new DeleteTemplateCommand({
        TemplateName: templateName,
      });

      await this.sesClient.send(command);

      this.logger.log(`Plantilla eliminada exitosamente: ${templateName}`);
    } catch (error) {
      this.logger.error(
        `Error al eliminar plantilla: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Lista todas las plantillas
   */
  async listTemplates(): Promise<any[]> {
    try {
      const command = new ListTemplatesCommand({});
      const response = await this.sesClient.send(command);

      return response.TemplatesMetadata || [];
    } catch (error) {
      this.logger.error(
        `Error al listar plantillas: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Obtiene los detalles de una plantilla específica
   */
  async getTemplate(templateName: string): Promise<any> {
    try {
      const command = new GetTemplateCommand({
        TemplateName: templateName,
      });

      const response = await this.sesClient.send(command);

      return response.Template;
    } catch (error) {
      this.logger.error(
        `Error al obtener plantilla: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Envía correos a múltiples destinatarios (útil para notificaciones masivas)
   */
  async sendBulkEmail(
    recipients: string[],
    subject: string,
    body: string,
    isHtml: boolean = true,
  ): Promise<string[]> {
    const emailPromises = recipients.map((recipient) =>
      this.sendEmail({
        to: recipient,
        subject,
        body,
        isHtml,
      }),
    );

    return Promise.all(emailPromises);
  }
}
