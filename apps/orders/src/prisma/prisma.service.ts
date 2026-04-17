import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/orders-client';
@Injectable()
export class PrismaService extends PrismaClient
implements OnModuleInit, OnModuleDestroy {
async onModuleInit() {
// Connect when the NestJS module initializes
await this.$connect();
}
async onModuleDestroy() {
// Disconnect cleanly when the service shuts down
// This is important for graceful Docker restarts
await this.$disconnect();
}
}