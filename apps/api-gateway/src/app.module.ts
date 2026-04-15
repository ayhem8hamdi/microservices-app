import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';

@Module({
  imports: [
	ClientsModule.register([
	  {
		name: 'USERS_SERVICE', // Injection token — use this in controllers
		transport: Transport.TCP,
		options: {
		  host: 'users', // Docker service name (or 'localhost' locally)
		  port: 3001,
		},
	  },
	  {
		name: 'ORDERS_SERVICE',
		transport: Transport.TCP,
		options: {
		  host: 'orders',
		  port: 3002,
		},
	  },
	]),
  ],
  controllers: [AppController],
})
export class AppModule {}