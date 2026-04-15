import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { OrderPlacedEvent, PATTERNS } from '../../../libs/shared/src';
@Controller()
export class NotificationsController {
  // @EventPattern — NOT @MessagePattern
  // This fires when Orders emits 'order_placed'
  // It returns nothing — the emitter does not care
@EventPattern(PATTERNS.EVENTS.ORDER_PLACED)
handleOrderPlaced(@Payload() data: OrderPlacedEvent) {
// In production this would call an email provider (SendGrid, SES, etc.)
// For now we just log it
console.log(`
[Notifications] Sending order confirmation`,
`To: ${data.userEmail}`,
`Order #${data.orderId} confirmed - Total: $${data.total}`,
);
// You could also call another service here if needed
// No return needed — the emitter is not waiting
}
}
