# 🚀 WebSocket - Guía Completa

Sistema de WebSocket con Socket.IO integrado en tu proyecto NestJS para comunicación en tiempo real.

## 📋 Características Implementadas

### ✅ Funcionalidades de WebSocket:
- **Mensajes directos** entre usuarios
- **Broadcast** a todos los usuarios conectados
- **Salas (Rooms)** para grupos de usuarios
- **Notificaciones en tiempo real**
- **Gestión de usuarios conectados**
- **Integración con servicios AWS** (S3, SES, SQS)

---

## 🎯 Casos de Uso

### 1. **Mensajes en Tiempo Real**
- Chat entre usuarios
- Notificaciones instantáneas
- Alertas del sistema

### 2. **Notificaciones de AWS**
- Archivo subido a S3 → Notificación al usuario
- Email enviado → Confirmación en tiempo real
- Proceso SQS completado → Alerta al usuario

### 3. **Salas/Grupos**
- Chat de equipos
- Notificaciones por departamento
- Transmisión en vivo de eventos

---

## 🔧 Configuración

### **1. Instalar Dependencias** ✅ (Ya instalado)
```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

### **2. Iniciar el Servidor**
```bash
npm run start:dev
```

El WebSocket estará disponible en: `ws://localhost:3000`

---

## 📡 Eventos WebSocket Disponibles

### **Eventos del Cliente → Servidor:**

| Evento | Descripción | Datos |
|--------|-------------|-------|
| `register` | Registrar usuario con su ID | `{ userId: string }` |
| `sendMessage` | Enviar mensaje a un usuario | `{ to: string, message: string, from?: string }` |
| `broadcast` | Enviar mensaje a todos | `{ message: string, type?: string }` |
| `joinRoom` | Unirse a una sala | `{ room: string }` |
| `leaveRoom` | Salir de una sala | `{ room: string }` |
| `roomMessage` | Enviar mensaje a una sala | `{ room: string, message: string }` |

### **Eventos del Servidor → Cliente:**

| Evento | Descripción | Datos |
|--------|-------------|-------|
| `welcome` | Mensaje de bienvenida al conectar | `{ message: string, socketId: string }` |
| `registered` | Confirmación de registro | `{ userId: string, socketId: string, message: string }` |
| `newMessage` | Mensaje directo recibido | `{ from: string, message: string, timestamp: Date }` |
| `broadcastMessage` | Mensaje broadcast recibido | `{ from: string, message: string, type: string, timestamp: Date }` |
| `notification` | Notificación recibida | `{ type: string, title: string, message: string, data?: any, timestamp: Date }` |
| `roomMessage` | Mensaje de sala recibido | `{ room: string, from: string, message: string, timestamp: Date }` |
| `userJoined` | Usuario se unió a sala | `{ userId: string, room: string }` |
| `userLeft` | Usuario salió de sala | `{ userId: string, room: string }` |

---

## 🖥️ Cliente HTML de Prueba

Abre el archivo `websocket-client.html` en tu navegador para probar todas las funcionalidades.

```bash
# Abre el archivo en tu navegador
start websocket-client.html
```

### Funciones del Cliente:
1. **Registro**: Ingresa tu ID de usuario y regístrate
2. **Mensajes Directos**: Envía mensajes a usuarios específicos
3. **Broadcast**: Envía mensajes a todos
4. **Salas**: Únete a salas y chatea en grupos
5. **Notificaciones**: Recibe notificaciones en tiempo real

---

## 📝 Endpoints REST para Notificaciones

### **1. Enviar Notificación a Usuario Específico**
```bash
POST http://localhost:3000/notifications/send
Content-Type: application/json

{
  "userId": "user123",
  "title": "Nueva notificación",
  "message": "Tienes un nuevo mensaje",
  "type": "info",
  "data": {
    "link": "/messages/123"
  }
}
```

### **2. Enviar Notificación a Todos (Broadcast)**
```bash
POST http://localhost:3000/notifications/broadcast
Content-Type: application/json

{
  "title": "Mantenimiento programado",
  "message": "El sistema estará en mantenimiento mañana a las 2 AM",
  "type": "warning"
}
```

### **3. Enviar Notificación a una Sala**
```bash
POST http://localhost:3000/notifications/room
Content-Type: application/json

{
  "room": "developers",
  "title": "Nueva versión disponible",
  "message": "La versión 2.0 está lista para probar",
  "type": "success"
}
```

### **4. Verificar si Usuario está Conectado**
```bash
GET http://localhost:3000/notifications/status/user123
```

**Respuesta:**
```json
{
  "statusCode": 200,
  "data": {
    "userId": "user123",
    "isConnected": true,
    "status": "online"
  }
}
```

### **5. Obtener Usuarios Conectados**
```bash
GET http://localhost:3000/notifications/connected
```

**Respuesta:**
```json
{
  "statusCode": 200,
  "message": "Usuarios conectados obtenidos exitosamente",
  "data": {
    "count": 3,
    "users": ["user123", "user456", "user789"]
  }
}
```

---

## 🔗 Integración con Servicios AWS

### **1. Notificación al Subir Archivo a S3**

Ahora el endpoint `/s3/upload` soporta notificaciones:

```bash
POST http://localhost:3000/s3/upload?userId=user123
Content-Type: multipart/form-data

# Adjunta el archivo
```

El usuario `user123` recibirá una notificación en tiempo real:
```json
{
  "type": "file_uploaded",
  "title": "Archivo subido",
  "message": "El archivo 'documento.pdf' se subió exitosamente",
  "data": {
    "fileName": "documento.pdf",
    "fileUrl": "https://..."
  }
}
```

### **2. Uso Programático desde Servicios**

```typescript
import { NotificationService } from './modules/websocket/notification.service';

@Injectable()
export class MiServicio {
  constructor(private notificationService: NotificationService) {}

  async procesarAlgo(userId: string) {
    // Tu lógica...
    
    // Enviar notificación
    this.notificationService.notifySuccess(
      userId,
      'Proceso completado',
      'Tu solicitud fue procesada exitosamente'
    );
  }
}
```

---

## 💻 Ejemplos de Código Cliente

### **JavaScript/TypeScript (Frontend)**

```javascript
import { io } from 'socket.io-client';

// Conectar
const socket = io('http://localhost:3000');

// Escuchar conexión
socket.on('connect', () => {
  console.log('Conectado:', socket.id);
  
  // Registrar usuario
  socket.emit('register', { userId: 'user123' });
});

// Escuchar notificaciones
socket.on('notification', (data) => {
  console.log('Notificación:', data);
  // Mostrar en UI
  showNotification(data.title, data.message, data.type);
});

// Enviar mensaje
function enviarMensaje(destinatario, mensaje) {
  socket.emit('sendMessage', {
    to: destinatario,
    message: mensaje
  });
}

// Recibir mensaje
socket.on('newMessage', (data) => {
  console.log('Mensaje de', data.from, ':', data.message);
});

// Unirse a sala
socket.emit('joinRoom', { room: 'general' });

// Enviar a sala
socket.emit('roomMessage', {
  room: 'general',
  message: 'Hola a todos!'
});
```

### **React Example**

```jsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function App() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    
    newSocket.on('connect', () => {
      console.log('Conectado');
      newSocket.emit('register', { userId: 'user123' });
    });

    newSocket.on('notification', (data) => {
      setMessages(prev => [...prev, data]);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const sendMessage = (to, message) => {
    socket.emit('sendMessage', { to, message });
  };

  return (
    <div>
      <h1>Chat en Tiempo Real</h1>
      {messages.map((msg, i) => (
        <div key={i}>
          <strong>{msg.title}:</strong> {msg.message}
        </div>
      ))}
    </div>
  );
}
```

### **Vue.js Example**

```vue
<template>
  <div>
    <h1>Notificaciones en Tiempo Real</h1>
    <div v-for="notif in notifications" :key="notif.id">
      <div :class="notif.type">
        <h3>{{ notif.title }}</h3>
        <p>{{ notif.message }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { io } from 'socket.io-client';

export default {
  data() {
    return {
      socket: null,
      notifications: []
    }
  },
  mounted() {
    this.socket = io('http://localhost:3000');
    
    this.socket.on('connect', () => {
      this.socket.emit('register', { userId: 'user123' });
    });

    this.socket.on('notification', (data) => {
      this.notifications.push(data);
    });
  },
  beforeUnmount() {
    this.socket.close();
  }
}
</script>
```

---

## 🎨 Tipos de Notificaciones

```typescript
enum NotificationType {
  INFO = 'info',                      // Información general
  SUCCESS = 'success',                // Operación exitosa
  WARNING = 'warning',                // Advertencia
  ERROR = 'error',                    // Error
  FILE_UPLOADED = 'file_uploaded',    // Archivo subido
  EMAIL_SENT = 'email_sent',          // Email enviado
  MESSAGE_RECEIVED = 'message_received' // Mensaje recibido
}
```

---

## 🔒 Seguridad y Buenas Prácticas

### **1. CORS en Producción**
Actualiza el gateway para producción:

```typescript
@WebSocketGateway({
  cors: {
    origin: ['https://tudominio.com'],  // Tu dominio real
    credentials: true,
  },
})
```

### **2. Autenticación**
Implementa autenticación JWT:

```typescript
handleConnection(client: Socket) {
  const token = client.handshake.auth.token;
  // Verificar token
  if (!this.verifyToken(token)) {
    client.disconnect();
    return;
  }
}
```

### **3. Rate Limiting**
Limita la cantidad de mensajes por usuario:

```typescript
private messageCount = new Map<string, number>();

@SubscribeMessage('sendMessage')
handleMessage(@ConnectedSocket() client: Socket) {
  const count = this.messageCount.get(client.id) || 0;
  if (count > 10) {  // Máximo 10 mensajes por minuto
    return { error: 'Rate limit exceeded' };
  }
  this.messageCount.set(client.id, count + 1);
  // ... resto del código
}
```

---

## 📊 Monitoreo y Debugging

### **Ver usuarios conectados en consola:**
```bash
GET http://localhost:3000/notifications/connected
```

### **Logs del servidor:**
Los logs del WebSocket Gateway aparecen en la consola:
```
[WebsocketGateway] WebSocket Gateway inicializado
[WebsocketGateway] Cliente conectado: abc123
[WebsocketGateway] Usuario user123 registrado con socket abc123
[WebsocketGateway] Mensaje enviado de user123 a user456
```

---

## 🚀 Próximos Pasos

1. **Implementa autenticación JWT** para mayor seguridad
2. **Agrega persistencia** de mensajes (MongoDB, PostgreSQL)
3. **Implementa typing indicators** ("usuario está escribiendo...")
4. **Agrega file sharing** a través de WebSocket
5. **Implementa video/audio calls** con WebRTC

---

## 📚 Recursos Adicionales

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [WebSocket Client HTML](./websocket-client.html)

---

**¡WebSockets listos para usar! 🎉**
