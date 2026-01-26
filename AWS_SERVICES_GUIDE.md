# AWS Services - NestJS Integration

Sistema completo para integración con servicios de AWS (S3, SQS, SES) en NestJS con arquitectura modular y buenas prácticas.

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- Una cuenta de AWS con credenciales configuradas
- Buckets de S3, colas SQS y SES configurados en AWS

## 🚀 Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

3. Editar el archivo `.env` con tus credenciales de AWS:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_S3_BUCKET=tu-bucket-name
AWS_SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/tu-cola
AWS_SES_FROM_EMAIL=noreply@tudominio.com
```

## 📁 Estructura del Proyecto

```
src/
├── config/
│   └── aws.config.ts           # Configuración centralizada de AWS
├── modules/
│   ├── s3/                     # Módulo para Amazon S3
│   │   ├── s3.module.ts
│   │   ├── s3.service.ts
│   │   └── s3.controller.ts
│   ├── sqs/                    # Módulo para Amazon SQS
│   │   ├── sqs.module.ts
│   │   ├── sqs.service.ts
│   │   ├── sqs.controller.ts
│   │   └── dto/
│   │       └── sqs.dto.ts
│   └── ses/                    # Módulo para Amazon SES
│       ├── ses.module.ts
│       ├── ses.service.ts
│       ├── ses.controller.ts
│       └── dto/
│           └── ses.dto.ts
└── app.module.ts
```

## 🎯 Características

### 1. Amazon S3 - Almacenamiento de Archivos

#### Funcionalidades:
- ✅ Subir archivos individuales
- ✅ Subir múltiples archivos
- ✅ Generar URLs firmadas (temporal access)
- ✅ Eliminar archivos
- ✅ Organización por carpetas

#### Endpoints:

**Subir un archivo:**
```bash
POST /s3/upload
Content-Type: multipart/form-data

# Con folder opcional
POST /s3/upload?folder=imagenes

Body: file (multipart/form-data)
```

**Subir múltiples archivos:**
```bash
POST /s3/upload-multiple?folder=documentos
Body: files[] (multipart/form-data, máximo 10 archivos)
```

**Obtener URL firmada:**
```bash
GET /s3/signed-url/:key?expiresIn=3600
```

**Eliminar archivo:**
```bash
DELETE /s3/:key
```

#### Uso Programático:
```typescript
import { S3Service } from './modules/s3/s3.service';

constructor(private s3Service: S3Service) {}

// Subir archivo
const result = await this.s3Service.uploadFile(file, 'imagenes');
// { url: 'https://...', key: 'imagenes/123456-file.png' }

// URL firmada
const signedUrl = await this.s3Service.getSignedUrl('mi-archivo.pdf', 3600);

// Eliminar archivo
await this.s3Service.deleteFile('imagenes/123456-file.png');
```

### 2. Amazon SQS - Colas de Mensajes

#### Funcionalidades:
- ✅ Enviar mensajes individuales
- ✅ Enviar mensajes en lote (hasta 10)
- ✅ Recibir mensajes con long polling
- ✅ Eliminar mensajes procesados
- ✅ Procesar mensajes con callback automático
- ✅ Obtener atributos de la cola

#### Endpoints:

**Enviar mensaje:**
```bash
POST /sqs/send
Content-Type: application/json

{
  "message": {
    "action": "process-order",
    "orderId": "12345",
    "data": { ... }
  },
  "delaySeconds": 0
}
```

**Enviar mensajes en lote:**
```bash
POST /sqs/send-batch
Content-Type: application/json

{
  "messages": [
    { "action": "email", "to": "user@example.com" },
    { "action": "notification", "userId": "123" }
  ]
}
```

**Recibir mensajes:**
```bash
GET /sqs/receive?maxMessages=10&waitTimeSeconds=20
```

**Obtener atributos de la cola:**
```bash
GET /sqs/attributes
```

#### Uso Programático:
```typescript
import { SqsService } from './modules/sqs/sqs.service';

constructor(private sqsService: SqsService) {}

// Enviar mensaje
const messageId = await this.sqsService.sendMessage({
  action: 'send-email',
  email: 'user@example.com'
});

// Procesar mensajes automáticamente
await this.sqsService.processMessages(async (message) => {
  console.log('Procesando:', message);
  // Tu lógica aquí
}, 10);

// Enviar lote
await this.sqsService.sendMessageBatch([
  { task: 'task1' },
  { task: 'task2' }
]);
```

### 3. Amazon SES - Servicio de Email

#### Funcionalidades:
- ✅ Enviar correos simples (HTML/texto)
- ✅ Enviar correos con plantillas
- ✅ Crear plantillas de email
- ✅ Actualizar plantillas
- ✅ Listar plantillas
- ✅ Eliminar plantillas
- ✅ Soporte para CC, BCC, Reply-To
- ✅ Envío masivo de correos

#### Endpoints:

**Enviar correo simple:**
```bash
POST /ses/send
Content-Type: application/json

{
  "to": "destinatario@example.com",
  "subject": "Bienvenido",
  "body": "<h1>Hola!</h1><p>Bienvenido a nuestra plataforma</p>",
  "isHtml": true,
  "cc": ["copia@example.com"],
  "replyTo": ["responder@example.com"]
}
```

**Enviar correo con plantilla:**
```bash
POST /ses/send-templated
Content-Type: application/json

{
  "to": "user@example.com",
  "templateName": "welcome-email",
  "templateData": {
    "name": "Juan",
    "activationLink": "https://example.com/activate/123"
  }
}
```

**Crear plantilla:**
```bash
POST /ses/template
Content-Type: application/json

{
  "name": "welcome-email",
  "subject": "Bienvenido {{name}}",
  "htmlBody": "<h1>Hola {{name}}</h1><p>Click aquí: {{activationLink}}</p>",
  "textBody": "Hola {{name}}, click aquí: {{activationLink}}"
}
```

**Listar plantillas:**
```bash
GET /ses/templates
```

**Obtener plantilla:**
```bash
GET /ses/template/welcome-email
```

**Eliminar plantilla:**
```bash
DELETE /ses/template/welcome-email
```

#### Uso Programático:
```typescript
import { SesService } from './modules/ses/ses.service';

constructor(private sesService: SesService) {}

// Enviar correo simple
const messageId = await this.sesService.sendEmail({
  to: 'user@example.com',
  subject: 'Hola',
  body: '<p>Mensaje</p>',
  isHtml: true
});

// Enviar con plantilla
await this.sesService.sendTemplatedEmail({
  to: 'user@example.com',
  templateName: 'welcome-email',
  templateData: { name: 'Juan', code: '123' }
});

// Crear plantilla
await this.sesService.createTemplate({
  name: 'my-template',
  subject: 'Subject {{variable}}',
  htmlBody: '<html>...</html>',
  textBody: 'Text version...'
});
```

## 🛠️ Buenas Prácticas Implementadas

### 1. Arquitectura Modular
- Cada servicio de AWS en su propio módulo
- Separación de responsabilidades (controllers, services, DTOs)
- Módulos exportables para reutilización

### 2. Configuración Centralizada
- Variables de entorno con `@nestjs/config`
- Configuración tipada y validada
- Archivo de configuración único para AWS

### 3. Logging y Manejo de Errores
- Logger de NestJS en todos los servicios
- Try-catch con logs descriptivos
- Errores propagados correctamente

### 4. Validación de Datos
- DTOs con class-validator
- Validación automática en controllers
- Tipos TypeScript estrictos

### 5. Documentación de Código
- Comentarios JSDoc en métodos importantes
- Interfaces bien definidas
- README completo

### 6. Seguridad
- Credenciales en variables de entorno
- .env en .gitignore
- URLs firmadas para acceso temporal

## 🚀 Ejecutar la Aplicación

### Modo Desarrollo:
```bash
npm run start:dev
```

### Modo Producción:
```bash
npm run build
npm run start:prod
```

La aplicación estará disponible en `http://localhost:3000`

## 📝 Ejemplos de Uso Completos

### Ejemplo 1: Subir imagen y enviar notificación por email

```typescript
@Post('upload-and-notify')
@UseInterceptors(FileInterceptor('image'))
async uploadAndNotify(
  @UploadedFile() image: Express.Multer.File,
  @Body('email') email: string,
) {
  // 1. Subir imagen a S3
  const { url, key } = await this.s3Service.uploadFile(image, 'uploads');
  
  // 2. Enviar notificación por email
  await this.sesService.sendEmail({
    to: email,
    subject: 'Imagen subida exitosamente',
    body: `<p>Tu imagen fue subida: <a href="${url}">Ver imagen</a></p>`,
    isHtml: true,
  });
  
  // 3. Encolar tarea de procesamiento
  await this.sqsService.sendMessage({
    action: 'process-image',
    key: key,
    url: url,
  });
  
  return { message: 'Proceso completado', url };
}
```

### Ejemplo 2: Procesar cola de emails

```typescript
@Cron('*/5 * * * *') // Cada 5 minutos
async processEmailQueue() {
  await this.sqsService.processMessages(async (message) => {
    if (message.action === 'send-email') {
      await this.sesService.sendTemplatedEmail({
        to: message.email,
        templateName: message.template,
        templateData: message.data,
      });
    }
  }, 10);
}
```

## 🔐 Configuración de AWS

### S3 Bucket:
1. Crear bucket en AWS Console
2. Configurar permisos públicos (si es necesario)
3. Configurar CORS si accedes desde frontend

### SQS Queue:
1. Crear cola estándar o FIFO
2. Configurar visibility timeout (30s recomendado)
3. Copiar URL de la cola

### SES:
1. Verificar dominio o email en SES
2. Salir del sandbox si necesitas enviar a cualquier email
3. Crear plantillas si las vas a usar
4. Configurar Configuration Set (opcional)

## 📦 Dependencias Principales

```json
{
  "@aws-sdk/client-s3": "^3.x",
  "@aws-sdk/client-sqs": "^3.x",
  "@aws-sdk/client-ses": "^3.x",
  "@aws-sdk/s3-request-presigner": "^3.x",
  "@nestjs/config": "^3.x",
  "class-validator": "^0.14.x",
  "class-transformer": "^0.5.x"
}
```

## 🤝 Contribuciones

Si encuentras mejoras o errores, siéntete libre de contribuir.

## 📄 Licencia

MIT

---

**Desarrollado con ❤️ usando NestJS y AWS SDK v3**
