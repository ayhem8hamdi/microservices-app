import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateOrderDto, PATTERNS } from '../../../libs/shared/src';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern(PATTERNS.ORDERS.PLACE)
  placeOrder(@Payload() data: CreateOrderDto) {
    return this.ordersService.placeOrder(data);
  }
}
