import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CreateUserDto } from '../../../libs/shared/src';
// In-memory store for now — Prisma comes in Tutorial 3
const users: any[] = [];
let idCounter = 1;
@Injectable()
export class UsersService {
findOne(id: number) {
  const user = users.find(u => u.id === id);

  if (!user) {
    throw new RpcException(`User ${id} not found`);
  }

  return user;
}
create(data: CreateUserDto) {
const user = { id: idCounter++, ...data };
users.push(user);
return user;
}
findAll() {
return users;
}
}
