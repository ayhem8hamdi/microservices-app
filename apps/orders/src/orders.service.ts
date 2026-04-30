// apps/orders/src/orders.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { PrismaService } from './prisma/prisma.service';
import { CreateOrderDto, OrderPlacedEvent, PATTERNS } from '@app/shared';
@Injectable()
export class OrdersService {
constructor(
private readonly prisma: PrismaService,
@Inject('USERS_SERVICE') private usersClient: ClientProxy,
@Inject('EVENT_BUS') private eventBus: ClientProxy,
) {}
async placeOrder(data: CreateOrderDto) {
// 1. Validate user exists — cross-service call
    const user = await firstValueFrom(
    this.usersClient.send(PATTERNS.USERS.GET_ONE, { id: data.userId
        }).pipe(
    catchError(err => throwError(() => new RpcException(err)))
        )
        );
// 2. Persist order and its items in a Prisma transaction
// If items fail to save, the order is rolled back automatically
const order = await this.prisma.$transaction(async (tx) => {
const created = await tx.order.create({
data: {
userId: data.userId,
total: data.total,
status: 'CONFIRMED',
items: {
create: data.items.map(item => ({
productId: item.productId,
quantity: item.quantity,
price: item.price,
})),
},
},
include: { items: true },
});
return created;
});
// 3. Emit event — non-blocking, runs after we already returned order
  const event: OrderPlacedEvent = { 
      orderId:   order.id, 
      userId:    user.id, 
      userEmail: user.email, 
      userName:  user.name, 
      total:     order.total, 
    };

    // Emit to the EXCHANGE with a routing key
     // RabbitMQ routes this to every queue bound to orders.exchange with 'order.*' or '#'
this.eventBus.emit(PATTERNS.EVENTS.ORDER_PLACED, event);
return order;
}


async findOne(id: number) {
const order = await this.prisma.order.findUnique({
where: { id },
include: { items: true },
});
if (!order) {
throw new RpcException({ statusCode: 404, message: `Order ${id} not
found` });
}
return order;
}
}
