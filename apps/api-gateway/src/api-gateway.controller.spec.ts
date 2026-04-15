import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';

import { AppController } from './app.controller';
import { PATTERNS } from 'libs/shared/src';

describe('AppController', () => {
  let appController: AppController;
  const usersClient = {
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
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    usersClient.send.mockReset();
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
});
