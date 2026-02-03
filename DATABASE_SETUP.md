# Configuración de Base de Datos MySQL

## Pasos para configurar la base de datos

### 1. Crear la base de datos

Ejecuta el siguiente comando en MySQL:

```sql
CREATE DATABASE aws_service_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

O si ya existe y quieres eliminarla primero:

```sql
DROP DATABASE IF EXISTS aws_service_db;
CREATE DATABASE aws_service_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Verificar la conexión

Las credenciales están configuradas en el archivo `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=aws_service_db
```

### 3. Iniciar la aplicación

Una vez creada la base de datos, inicia la aplicación:

```bash
npm run start:dev
```

La aplicación creará automáticamente todas las tablas necesarias gracias a `synchronize: true` en la configuración de TypeORM.

## Tablas que se crearán automáticamente

1. **uploaded_files** - Almacena información de archivos subidos a S3
   - id (UUID)
   - originalName
   - fileName
   - fileKey
   - fileUrl
   - folder
   - mimeType
   - size
   - userId
   - status
   - createdAt, updatedAt, deletedAt

2. **sent_emails** - Almacena correos enviados via SES
   - id (UUID)
   - messageId
   - to (array)
   - cc, bcc (array)
   - subject
   - body
   - isHtml
   - templateName
   - templateData (JSON)
   - userId
   - status
   - errorMessage
   - createdAt

3. **sqs_messages** - Almacena mensajes de cola SQS
   - id (UUID)
   - messageId
   - messageBody
   - messageAttributes (JSON)
   - delaySeconds
   - receiptHandle
   - status
   - userId
   - sentAt, receivedAt, processedAt, createdAt

4. **websocket_messages** - Almacena mensajes de WebSocket
   - id (UUID)
   - fromUserId
   - toUserId
   - message
   - status
   - room
   - type
   - metadata (JSON)
   - createdAt, deliveredAt, readAt

5. **notifications** - Almacena notificaciones enviadas
   - id (UUID)
   - userId
   - type
   - title
   - message
   - data (JSON)
   - isRead
   - status
   - readAt, createdAt, updatedAt

## Verificar tablas creadas

Ejecuta en MySQL:

```sql
USE aws_service_db;
SHOW TABLES;
```

Deberías ver las 5 tablas listadas arriba.

## Consultar datos

Ejemplos de consultas:

```sql
-- Ver archivos subidos
SELECT * FROM uploaded_files ORDER BY createdAt DESC LIMIT 10;

-- Ver correos enviados
SELECT * FROM sent_emails ORDER BY createdAt DESC LIMIT 10;

-- Ver mensajes SQS
SELECT * FROM sqs_messages ORDER BY createdAt DESC LIMIT 10;

-- Ver mensajes WebSocket
SELECT * FROM websocket_messages ORDER BY createdAt DESC LIMIT 10;

-- Ver notificaciones
SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 10;
```

## Nota de Producción

⚠️ **IMPORTANTE**: En producción, desactiva `synchronize: true` en la configuración de TypeORM y usa migraciones para gestionar cambios en el esquema de la base de datos.

Modifica [src/app.module.ts](src/app.module.ts) línea con `synchronize`:

```typescript
// En desarrollo
synchronize: true,

// En producción
synchronize: false,
```
