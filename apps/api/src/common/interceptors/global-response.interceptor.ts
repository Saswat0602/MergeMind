import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable()
export class GlobalResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => {
        // Avoid double-wrapping if the controller already returned this structure
        if (data && typeof data === 'object' && 'success' in data && ('data' in data || 'message' in data)) {
          return data as Response<T>;
        }
        return {
          success: true,
          data,
        };
      }),
    );
  }
}
