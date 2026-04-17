// apps/users/src/users.service.ts
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from './prisma/prisma.service';
import { CreateUserDto } from 'libs/shared/src';

@Injectable()
export class UsersService {
constructor(private readonly prisma: PrismaService) {}
async findOne(id: number) {
const user = await this.prisma.user.findUnique({
where: { id },
});
if (!user) {
throw new RpcException({ statusCode: 404, message: `User ${id} not
found` });
}
return user;
}
async create(data: CreateUserDto) {
// Check for duplicate email
const existing = await this.prisma.user.findUnique({
where: { email: data.email },
});
if (existing) {
throw new RpcException({ statusCode: 409, message: `Email already
registered` });
}
return this.prisma.user.create({ data });
}
async findAll() {
return this.prisma.user.findMany({
orderBy: { createdAt: 'desc' },
});
}
}