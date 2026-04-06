import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { UsersModule } from './users.module';
async function bootstrap() {
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
UsersModule,
{
transport: Transport.TCP,
options: {
host: '0.0.0.0', // Listen on all interfaces (needed in Docker)
port: 3001, // Each service gets its own port
},
},
);
await app.listen();
console.log('Users microservice is listening on TCP port 3001');
}
bootstrap();
