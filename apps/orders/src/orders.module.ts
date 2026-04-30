// apps/orders/src/orders.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaService } from './prisma/prisma.service';
import { EXCHANGES } from '@app/shared/constants/patterns';


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
        name: 'EVENT_BUS',  // it should be generic name because its not coupled directly with any service 
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL!],
          exchange: EXCHANGES.ORDERS.name,  //we will push to the exchange and he will complete the rest 
          exchangeType: EXCHANGES.ORDERS.type, 
          queueOptions: {
            durable: true, // queue survives RabbitMQ restarts
          },
          noAck: true, // always should be true from the producer side we never check here here d
        },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
})
export class OrdersModule {}