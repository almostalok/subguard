import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // Cookie parsing for secure HttpOnly sessions
  app.use(cookieParser());

  // CORS configuration
  const origin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: [origin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('SubGuard API')
    .setDescription('REST API for SubGuard — Recurring Payment Guardian')
    .setVersion('1.0.0')
    .addCookieAuth('subguard_session')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`[SubGuard API] Server running on http://localhost:${port}`);
  console.log(`[SubGuard API] Swagger documentation available at http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
