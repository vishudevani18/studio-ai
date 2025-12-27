import { Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { HttpExceptionFilter, AllExceptionsFilter } from './filters/http-exception.filter';

@Global()
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Removed custom ValidationPipe - using global ValidationPipe from main.ts instead
    // The global pipe has better error handling and formatting
  ],
  exports: [],
})
export class CommonModule {}
