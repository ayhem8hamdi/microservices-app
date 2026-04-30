import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { OrderPlacedEvent } from '@app/shared';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackOrderPlaced(data: OrderPlacedEvent) {
    return this.prisma.analyticsEvent.create({
      data: {
        eventType: 'ORDER_PLACED',
        userId: data.userId,
        orderId: data.orderId,
        value: data.total,
        payload: {
          userEmail: data.userEmail,
          userName: data.userName,
          total: data.total
        },
      },
    });
  }
}