import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(WorkerModule);
  console.log(`Worker application is running.`);
}
bootstrap().catch((err) => console.error(err));
