import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}
bootstrap().catch((err) => {
  console.error('Error during application bootstrap', err);
  process.exit(1);
});
