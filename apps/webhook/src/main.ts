import { NestFactory } from '@nestjs/core';
import { WebhookModule } from './webhook.module';

async function bootstrap() {
  const app = await NestFactory.create(WebhookModule, { rawBody: true });

  // The webhook receiver listens on port 3000 by default (because Smee payload goes to 3000)
  // Or we can configure it from env.
  const port = process.env.WEBHOOK_PORT || 3000;
  await app.listen(port);
  console.log(`Webhook application is running on: http://localhost:${port}`);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
