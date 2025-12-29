import { NestFactory } from '@nestjs/core';
import { AppWorkingModule } from './app-working.module';

async function bootstrap() {
  const app = await NestFactory.create(AppWorkingModule);
  
  // Enable CORS for frontend communication
  app.enableCors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  
  await app.listen(process.env.PORT ?? 3001);
  console.log('Working Site Management Backend is running on port ' + (process.env.PORT ?? 3001));
}
bootstrap();
