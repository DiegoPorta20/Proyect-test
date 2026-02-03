import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
  HttpStatus,
  HttpException,
  Req,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Service } from './s3.service';
import { NotificationService } from '../websocket/notification.service';
import { UploadedFile as UploadedFileEntity } from '../../entities/uploaded-file.entity';
import * as express from 'express';

@Controller('s3')
export class S3Controller {
  constructor(
    private readonly s3Service: S3Service,
    private readonly notificationService: NotificationService,
    @InjectRepository(UploadedFileEntity)
    private uploadedFileRepository: Repository<UploadedFileEntity>,
  ) {}

  /**
   * Endpoint para subir un archivo
   * POST /s3/upload
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
    @Query('userId') userId?: string,
  ) {
    if (!file) {
      throw new HttpException('No se proporcionó archivo', HttpStatus.BAD_REQUEST);
    }

    const result = await this.s3Service.uploadFile(file, folder);

    // Guardar en base de datos
    const uploadedFile = new UploadedFileEntity();
    uploadedFile.originalName = file.originalname;
    uploadedFile.fileName = result.key.split('/').pop() || result.key;
    uploadedFile.fileKey = result.key;
    uploadedFile.fileUrl = result.url;
    uploadedFile.folder = folder || null;
    uploadedFile.mimeType = file.mimetype;
    uploadedFile.size = file.size;
    uploadedFile.userId = userId || null;
    uploadedFile.status = 'active';
    await this.uploadedFileRepository.save(uploadedFile);

    // Enviar notificación en tiempo real si se proporciona userId
    if (userId) {
      this.notificationService.notifyFileUploaded(
        userId,
        file.originalname,
        result.url,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Archivo subido exitosamente',
      data: result,
    };
  }

  /**
   * Endpoint para subir múltiples archivos
   * POST /s3/upload-multiple
   */
  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10)) // Máximo 10 archivos
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new HttpException('No se proporcionaron archivos', HttpStatus.BAD_REQUEST);
    }

    const results = await this.s3Service.uploadMultipleFiles(files, folder);

    return {
      statusCode: HttpStatus.OK,
      message: `${results.length} archivos subidos exitosamente`,
      data: results,
    };
  }

  /**
   * Endpoint para obtener una URL firmada
   * GET /s3/signed-url/:key
   */
  @Get('signed-url/*')
  async getSignedUrl(
    @Req() request: express.Request,
    @Query('expiresIn') expiresIn?: number,
  ) {
    // Extraer el key desde la URL completa
    const key = request.url.replace('/s3/signed-url/', '').split('?')[0];
    
    if (!key) {
      throw new HttpException('No se proporcionó la key del archivo', HttpStatus.BAD_REQUEST);
    }

    console.log(key);
    const url = await this.s3Service.getSignedUrl(
      key,
      expiresIn ? parseInt(expiresIn.toString()) : 3600,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'URL firmada generada exitosamente',
      data: { url, expiresIn: expiresIn || 3600 },
    };
  }

  /**
   * Endpoint para eliminar un archivo
   * DELETE /s3/:key
   */
  @Delete('*')
  async deleteFile(@Req() request: express.Request) {
    // Extraer el key desde la URL completa
    const key = request.url.replace('/s3/', '').split('?')[0];
    
    if (!key) {
      throw new HttpException('No se proporcionó la key del archivo', HttpStatus.BAD_REQUEST);
    }

    await this.s3Service.deleteFile(key);

    return {
      statusCode: HttpStatus.OK,
      message: 'Archivo eliminado exitosamente',
    };
  }
}
