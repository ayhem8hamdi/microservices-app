// apps/orders/src/orders.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaService } from './prisma/prisma.service';


@Module({
  imports: [
    ClientsModule.register([
      {
        // Users is still TCP — request/response needs a reply
        // RabbitMQ works for events (emit) — TCP still works for requests (send)
        name: 'USERS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'users',
          port: 3001,
        },
      },
      {
        // Notifications switched to RabbitMQ — fire-and-forget events only
        name: 'NOTIFICATIONS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL!],
          queue: 'notifications_queue',
          queueOptions: {
            durable: true, // queue survives RabbitMQ restarts
          },
          noAck: true, // manual acknowledgement — safer, explained below
        },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
})
export class OrdersModule {}