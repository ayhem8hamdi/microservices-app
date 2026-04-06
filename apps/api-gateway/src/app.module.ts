import { Module } from '@nestjs/common';
import { ApiGatewayController } from './app.controller';
import { ApiGatewayService } from './api-gateway.service';

@Module({
  imports: [],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {}
