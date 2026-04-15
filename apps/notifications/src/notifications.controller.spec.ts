import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { OrderPlacedEvent } from '../../../libs/shared/src';

describe('NotificationsController', () => {
  let notificationsController: NotificationsController;
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [NotificationsService],
    }).compile();

    notificationsController = app.get<NotificationsController>(NotificationsController);
  });

  describe('handleOrderPlaced', () => {
    it('should handle order placed payload without throwing', () => {
      const payload: OrderPlacedEvent = {
        orderId: 1,
        userId: 1,
        userEmail: 'ali@test.com',
        userName: 'Ali',
        total: 59.98,
      };

      expect(() => notificationsController.handleOrderPlaced(payload)).not.toThrow();
      expect(logSpy).toHaveBeenCalled();
    });
  });
});
