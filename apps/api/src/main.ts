import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
