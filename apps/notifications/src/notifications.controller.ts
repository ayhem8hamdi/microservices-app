// notifications.controller.ts
import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';
import { PATTERNS, OrderPlacedEvent } from '@app/shared';

@Controller()
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @EventPattern(PATTERNS.EVENTS.ORDER_PLACED)
  async handleOrderPlaced(
    @Payload() data: OrderPlacedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const msg = context.getMessage();

    try {
      await this.service.handleOrderPlaced(data);
      channel.ack(msg);

    } catch (error) {
      console.error(`[Notifications] Failed to process order ${data.orderId}`, error);
      channel.nack(msg, false, true);
    }
  }
}