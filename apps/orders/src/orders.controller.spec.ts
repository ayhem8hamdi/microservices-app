import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrderDto } from '../../../libs/shared/src';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let ordersController: OrdersController;
  const ordersService = {
    placeOrder: jest.fn<(data: CreateOrderDto) => Promise<unknown>>(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: ordersService,
        },
      ],
    }).compile();

    ordersController = app.get<OrdersController>(OrdersController);
    ordersService.placeOrder.mockReset();
  });

  describe('placeOrder', () => {
    it('should delegate order placement to OrdersService', async () => {
      const dto: CreateOrderDto = {
        userId: 1,
        items: [{ productId: 10, quantity: 2, price: 50 }],
        total: 100,
      };

      const expectedOrder = {
        id: 1,
        ...dto,
        status: 'confirmed',
      };

      ordersService.placeOrder.mockResolvedValue(expectedOrder);

      await expect(ordersController.placeOrder(dto)).resolves.toEqual(expectedOrder);
      expect(ordersService.placeOrder).toHaveBeenCalledWith(dto);
    });
  });
});
