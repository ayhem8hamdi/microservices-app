import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { NotificationsModule } from './notifications.module';
async function bootstrap() {
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
NotificationsModule,
{
transport: Transport.TCP,
options: { host: '0.0.0.0', port: 3003 },
},
);
await app.listen();
console.log('Notifications microservice listening on TCP 3003');
}
bootstrap();