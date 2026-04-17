// apps/orders/src/orders.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaService } from './prisma/prisma.service';
@Module({
imports: [
ClientsModule.register([
// Orders needs to know about Users (for validation via send)
{
name: 'USERS_SERVICE',
transport: Transport.TCP,
options: { host: 'users', port: 3001 },
},
// Orders emits events that Notifications listens to
{
name: 'NOTIFICATIONS_SERVICE',
transport: Transport.TCP,
options: { host: 'notifications', port: 3003 },
},
]),
],
controllers: [OrdersController],
providers: [OrdersService,PrismaService],
})
export class OrdersModule {}
