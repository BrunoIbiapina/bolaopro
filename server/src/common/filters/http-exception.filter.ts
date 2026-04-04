import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    let message = exception.message;
    let errors: any = undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const objResponse = exceptionResponse as any;
      message = objResponse.message || message;
      errors = objResponse.error;
    }

    response.status(status).json({
      statusCode: status,
      message: message || 'Internal server error',
      timestamp: new Date().toISOString(),
      ...(errors && { errors }),
    });
  }
}
