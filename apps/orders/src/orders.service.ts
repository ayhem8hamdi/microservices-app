import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

import {
  CreateOrderDto,
  GetUserDto,
  OrderPlacedEvent,
  PATTERNS,
} from 'libs/shared/src';
@Injectable()
export class OrdersService {
  constructor(
    @Inject('USERS_SERVICE') private usersClient: ClientProxy,
    @Inject('NOTIFICATIONS_SERVICE') private notifClient: ClientProxy,
  ) {}

  async placeOrder(data: CreateOrderDto) {
    // 1. Validate user (SYNC CALL)
    const userPayload: GetUserDto = { id: data.userId };

    const user = await firstValueFrom(
      this.usersClient.send(PATTERNS.USERS.GET_ONE, userPayload).pipe(
        catchError((err) =>
          throwError(() => new RpcException(err))
        ),
      ),
    );

    // 2. Create order (local logic)
    const order = {
      id: Date.now(),
      userId: data.userId,
      items: data.items,
      total: data.total,
      status: 'confirmed',
      createdAt: new Date(),
    };

    // 3. Create typed event (SAFE + STRUCTURED)
    const event: OrderPlacedEvent = {
      orderId: order.id,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      total: order.total,
    };

    // 4. Emit event (ASYNC, FIRE-AND-FORGET)
    this.notifClient.emit(PATTERNS.EVENTS.ORDER_PLACED, event);

    // 5. Return response immediately
    return order;
  }
}