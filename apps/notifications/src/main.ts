// apps/notifications/src/main.ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { NotificationsModule } from './notifications.module';
import { EXCHANGES, QUEUES } from '@app/shared/constants/patterns';


async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationsModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672'],
        queue: QUEUES.NOTIFICATIONS, 
        queueOptions: {
          durable: true,  
          arguments: { 
            'x-dead-letter-exchange': 'notifications_dlx'
          },      // queue survives RabbitMQ restarts
        },

        // Bind this queue to the orders exchange 
        // Pattern 'order.*' = receives order.placed, order.shipped, order.cancelled 
        // but NOT user.created or payment.failed
        exchange: EXCHANGES.ORDERS.name, 
        exchangeType: EXCHANGES.ORDERS.type, 
        exchangeOptions: { durable: true }, 
        routingKey: 'order.*',    // Wildcard binding pattern 
        noAck: false,          // manual ack — we control when a message is "done"
        
        prefetchCount: 1,      // process one message at a time (explained below)
      },
    },
  );

  await app.listen();
  console.log('Notifications consuming from RabbitMQ notifications_queue');
}

bootstrap();