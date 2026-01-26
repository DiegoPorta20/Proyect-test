import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('aws.region');
    const accessKeyId = this.configService.get<string>('aws.accessKeyId');
    const secretAccessKey = this.configService.get<string>('aws.secretAccessKey');
    const bucket = this.configService.get<string>('aws.s3.bucket');

    if (!region || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error('AWS S3 configuration is missing. Please check your environment variables.');
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.bucket = bucket;
  }

  /**
   * Sube un archivo a S3 y devuelve la URL pública
   */
  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<{ url: string; key: string }> {
    try {
      const key = folder
        ? `${folder}/${Date.now()}-${file.originalname}`
        : `${Date.now()}-${file.originalname}`;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      const region = this.configService.get<string>('aws.region');
      const url = `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;

      this.logger.log(`Archivo subido exitosamente: ${key}`);

      return { url, key };
    } catch (error) {
      this.logger.error(`Error al subir archivo: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Genera una URL firmada temporal para acceso privado
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(
        `Error al generar URL firmada: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Elimina un archivo de S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`Archivo eliminado exitosamente: ${key}`);
    } catch (error) {
      this.logger.error(
        `Error al eliminar archivo: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sube múltiples archivos
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<{ url: string; key: string }[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }
}
