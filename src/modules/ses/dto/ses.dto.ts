import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
} from 'class-validator';

export class SendEmailDto {
  @IsNotEmpty()
  to: string | string[];

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  body: string;

  @IsOptional()
  @IsBoolean()
  isHtml?: boolean = true;

  @IsOptional()
  @IsArray()
  cc?: string[];

  @IsOptional()
  @IsArray()
  bcc?: string[];

  @IsOptional()
  @IsArray()
  replyTo?: string[];
}

export class SendTemplatedEmailDto {
  @IsNotEmpty()
  to: string | string[];

  @IsNotEmpty()
  @IsString()
  templateName: string;

  @IsNotEmpty()
  @IsObject()
  templateData: Record<string, any>;

  @IsOptional()
  @IsArray()
  cc?: string[];

  @IsOptional()
  @IsArray()
  bcc?: string[];

  @IsOptional()
  @IsArray()
  replyTo?: string[];
}

export class CreateTemplateDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  htmlBody: string;

  @IsOptional()
  @IsString()
  textBody?: string;
}
