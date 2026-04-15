import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';

import { AppController } from './app.controller';
import { PATTERNS } from '../../../libs/shared/src';

describe('AppController', () => {
  let appController: AppController;
  const usersClient = {
    send: jest.fn(),
  };
  const ordersClient = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: 'USERS_SERVICE',
          useValue: usersClient,
        },
        {
          provide: 'ORDERS_SERVICE',
          useValue: ordersClient,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    usersClient.send.mockReset();
    ordersClient.send.mockReset();
  });

  describe('getUser', () => {
    it('should request a user by id from the users service', async () => {
      usersClient.send.mockReturnValue(of({ id: 1, name: 'John', email: 'john@example.com' }));

      await expect(appController.getUser('1')).resolves.toEqual({
        id: 1,
        name: 'John',
        email: 'john@example.com',
      });

      expect(usersClient.send).toHaveBeenCalledWith(PATTERNS.USERS.GET_ONE, { id: 1 });
    });
  });

  describe('createOrder', () => {
    it('should forward order creation to orders service', async () => {
      const payload = {
        userId: 1,
        items: [{ productId: 5, quantity: 2, price: 29.99 }],
        total: 59.98,
      };

      const orderResponse = { id: 123, ...payload, status: 'confirmed' };
      ordersClient.send.mockReturnValue(of(orderResponse));

      await expect(appController.createOrder(payload)).resolves.toEqual(orderResponse);
      expect(ordersClient.send).toHaveBeenCalledWith(PATTERNS.ORDERS.PLACE, payload);
    });
  });
});
