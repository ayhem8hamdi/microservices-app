import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AnalyticsService } from './analytics.service';
import { OrderPlacedEvent, PATTERNS } from '@app/shared';

@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @EventPattern(PATTERNS.EVENTS.ORDER_PLACED)
  async handleOrderPlaced(@Payload() data: OrderPlacedEvent) {
    return this.analyticsService.trackOrderPlaced(data);
  }
}