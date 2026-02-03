import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SesService } from './ses.service';
import {
  SendEmailDto,
  SendTemplatedEmailDto,
  CreateTemplateDto,
} from './dto/ses.dto';
import { SentEmail } from '../../entities/sent-email.entity';

@Controller('ses')
export class SesController {
  constructor(
    private readonly sesService: SesService,
    @InjectRepository(SentEmail)
    private sentEmailRepository: Repository<SentEmail>,
  ) {}

  /**
   * Endpoint para enviar un correo simple
   * POST /ses/sendhttp://localhost:3000/s3/upload
   */
  @Post('send')
  async sendEmail(@Body(ValidationPipe) dto: SendEmailDto) {
    const messageId = await this.sesService.sendEmail({
      to: dto.to,
      subject: dto.subject,
      body: dto.body,
      isHtml: dto.isHtml,
      cc: dto.cc,
      bcc: dto.bcc,
      replyTo: dto.replyTo,
    });

    // Guardar en base de datos
    const sentEmail = this.sentEmailRepository.create({
      messageId,
      to: Array.isArray(dto.to) ? dto.to : [dto.to],
      cc: dto.cc ? (Array.isArray(dto.cc) ? dto.cc : [dto.cc]) : [],
      bcc: dto.bcc ? (Array.isArray(dto.bcc) ? dto.bcc : [dto.bcc]) : [],
      subject: dto.subject,
      body: dto.body,
      isHtml: dto.isHtml || false,
      status: 'sent',
    });
    await this.sentEmailRepository.save(sentEmail);

    return {
      statusCode: HttpStatus.OK,
      message: 'Correo enviado exitosamente',
      data: { messageId },
    };
  }

  /**
   * Endpoint para enviar un correo usando plantilla
   * POST /ses/send-templated
   */
  @Post('send-templated')
  async sendTemplatedEmail(@Body(ValidationPipe) dto: SendTemplatedEmailDto) {
    const messageId = await this.sesService.sendTemplatedEmail({
      to: dto.to,
      templateName: dto.templateName,
      templateData: dto.templateData,
      cc: dto.cc,
      bcc: dto.bcc,
      replyTo: dto.replyTo,
    });

    // Guardar en base de datos
    const sentEmail = this.sentEmailRepository.create({
      messageId,
      to: Array.isArray(dto.to) ? dto.to : [dto.to],
      cc: dto.cc ? (Array.isArray(dto.cc) ? dto.cc : [dto.cc]) : [],
      bcc: dto.bcc ? (Array.isArray(dto.bcc) ? dto.bcc : [dto.bcc]) : [],
      subject: `Template: ${dto.templateName}`,
      body: JSON.stringify(dto.templateData),
      templateName: dto.templateName,
      templateData: dto.templateData,
      isHtml: true,
      status: 'sent',
    });
    await this.sentEmailRepository.save(sentEmail);

    return {
      statusCode: HttpStatus.OK,
      message: 'Correo con plantilla enviado exitosamente',
      data: { messageId },
    };
  }

  /**
   * Endpoint para crear una plantilla
   * POST /ses/template
   */
  @Post('template')
  async createTemplate(@Body(ValidationPipe) dto: CreateTemplateDto) {
    await this.sesService.createTemplate({
      name: dto.name,
      subject: dto.subject,
      htmlBody: dto.htmlBody,
      textBody: dto.textBody,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Plantilla creada exitosamente',
    };
  }

  /**
   * Endpoint para listar todas las plantillas
   * GET /ses/templates
   */
  @Get('templates')
  async listTemplates() {
    const templates = await this.sesService.listTemplates();

    return {
      statusCode: HttpStatus.OK,
      message: 'Plantillas obtenidas exitosamente',
      data: templates,
    };
  }

  /**
   * Endpoint para obtener una plantilla específica
   * GET /ses/template/:name
   */
  @Get('template/:name')
  async getTemplate(@Param('name') name: string) {
    const template = await this.sesService.getTemplate(name);

    return {
      statusCode: HttpStatus.OK,
      message: 'Plantilla obtenida exitosamente',
      data: template,
    };
  }

  /**
   * Endpoint para eliminar una plantilla
   * DELETE /ses/template/:name
   */
  @Delete('template/:name')
  async deleteTemplate(@Param('name') name: string) {
    await this.sesService.deleteTemplate(name);

    return {
      statusCode: HttpStatus.OK,
      message: 'Plantilla eliminada exitosamente',
    };
  }
}
