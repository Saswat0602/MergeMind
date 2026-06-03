import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(WorkerModule);
  await app.listen();
  console.log(`Worker application is running.`);
}
bootstrap();
