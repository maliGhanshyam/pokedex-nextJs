import { NestFactory } from '@nestjs/core';
import { ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import * as compression from 'compression';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    // Use process.env.PORT directly (required by Render)
    const port = process.env.PORT || configService.get('PORT') || 3001;
    const corsOrigin = configService.get('CORS_ORIGIN', 'http://localhost:3000');

    // Enable compression for better performance
    app.use(compression());

    app.enableCors({
      origin: corsOrigin,
      credentials: true,
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
          // Format validation errors for better client-side handling
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

    // Global exception filter for consistent error handling
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on port ${port}`);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();

