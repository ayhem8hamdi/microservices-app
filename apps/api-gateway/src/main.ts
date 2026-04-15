import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RpcExceptionFilter } from './common/filters/rpc-exception.filter';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    app.useGlobalFilters(new RpcExceptionFilter());

  await app.listen(process.env.port ?? 3000);
}
bootstrap();



