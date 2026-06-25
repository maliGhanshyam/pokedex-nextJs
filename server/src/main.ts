import { NestFactory } from '@nestjs/core';
import { ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';

function parseCorsOrigins(raw: string): string | string[] {
  const origins = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
}

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    const port = process.env.PORT || configService.get('PORT') || 3001;
    const corsOrigin = parseCorsOrigins(
      configService.get('CORS_ORIGIN', 'http://localhost:3000'),
    );

    // Required for Secure cookies behind Render's reverse proxy
    app.getHttpAdapter().getInstance().set('trust proxy', 1);

    app.use(cookieParser());
    app.use(compression());

    app.enableCors({
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        exceptionFactory: (errors) => {
          const messages = errors.map((error) => {
            if (error.constraints) {
              return Object.values(error.constraints).join(', ');
            }
            return error.property;
          });
          return new HttpException(
            {
              statusCode: 400,
              message: messages.length > 0 ? messages : 'Validation failed',
              error: 'Bad Request',
            },
            HttpStatus.BAD_REQUEST,
          );
        },
      }),
    );

    app.useGlobalFilters(new AllExceptionsFilter());

    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on port ${port}`);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
