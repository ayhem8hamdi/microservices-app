// apps/notifications/src/main.ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { NotificationsModule } from './notifications.module';


async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationsModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672'],
        queue: 'notifications_queue',
        queueOptions: {
          durable: true,       // queue survives RabbitMQ restarts
        },
        noAck: false,          // manual ack — we control when a message is "done"
        prefetchCount: 1,      // process one message at a time (explained below)
      },
    },
  );

  await app.listen();
  console.log('Notifications consuming from RabbitMQ notifications_queue');
}

bootstrap();