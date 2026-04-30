// apps/analytics/src/main.ts 
import { NestFactory } from '@nestjs/core'; 
import { Transport, MicroserviceOptions } from '@nestjs/microservices'; 
import { AnalyticsModule } from './analytics.module'; 
import { EXCHANGES } from '@app/shared'; 
 
async function bootstrap() { 
  const app = await NestFactory.createMicroservice<MicroserviceOptions>( 
    AnalyticsModule, 
    { 
      transport: Transport.RMQ, 
      options: { 
        urls: [process.env.RABBITMQ_URL!],
         // Analytics has its OWN queue — separate from notifications_queue 
        // Both queues receive a copy of every matched message 
        queue: 'analytics_queue', 
        queueOptions: {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': 'analytics_dlx',
          },
        },
 
        // Bind to same exchange, but with '#' = receive EVERYTHING 
        exchange: EXCHANGES.ORDERS.name, 
        exchangeType: EXCHANGES.ORDERS.type, 
        exchangeOptions: { durable: true }, 
        routingKey: '#',    // Match all routing keys on this exchange 
 
        noAck: false, 
        prefetchCount: 5,   // Analytics can handle more concurrency 
      }, 
    }, 
  ); 
 
  await app.listen(); 
  console.log('Analytics consuming all events from orders.exchange'); 
} 
 
bootstrap();