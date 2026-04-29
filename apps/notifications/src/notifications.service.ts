// notifications.service.ts
import { Injectable } from '@nestjs/common';
import { OrderPlacedEvent } from '@app/shared';

@Injectable()
export class NotificationsService {

  async handleOrderPlaced(data: OrderPlacedEvent): Promise<void> {
    // In production: call SendGrid, SES, Twilio, etc.
    console.log(`
      [Notifications] Sending order confirmation
      To: ${data.userEmail}
      Order #${data.orderId} confirmed - Total: $${data.total}
    `);
  }
}