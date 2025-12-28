import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        
        // Include validation errors if present
        if (Array.isArray(responseObj.message)) {
          errorDetails = responseObj.message;
        } else if (responseObj.error) {
          errorDetails = responseObj.error;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
        `${request.method} ${request.url}`,
      );
    } else {
      this.logger.error(
        `Unknown error: ${JSON.stringify(exception)}`,
        `${request.method} ${request.url}`,
      );
    }

    // Log error for debugging (but don't expose sensitive info in production)
    const errorLog = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errorDetails && { errorDetails }),
    };

    if (status >= 500) {
      this.logger.error('Server error:', errorLog);
    } else {
      this.logger.warn('Client error:', errorLog);
    }

    // Return user-friendly error response
    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };

    // Only include error details for 4xx errors (validation errors, etc.)
    if (errorDetails && status < 500) {
      errorResponse.message = errorDetails;
    }

    response.status(status).json(errorResponse);
  }
}

