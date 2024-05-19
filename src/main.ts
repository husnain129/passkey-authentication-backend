/* eslint-disable no-var */
import { NestFactory } from '@nestjs/core';
import * as crypto from 'crypto';
import { AppModule } from './app.module';

declare global {
  var crypto: typeof crypto;
}

if (!globalThis.crypto) {
  globalThis.crypto = crypto as any; // Type assertion to bypass type checking
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    allowedHeaders: 'Content-Type, Accept',
  });

  const PORT = process.env.PORT || 5500;
  await app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
bootstrap();
