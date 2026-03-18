import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class SetAccessTokenHeaderInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    return next.handle().pipe(
      tap((data) => {
        if (data?.value?.accessToken) {
          response.setHeader(
            'Authorization',
            `Bearer ${data.value.accessToken}`,
          );
        }
        if (data?.refreshToken) {
          response.cookie('refresh_token', data.refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'none',
          });
        }
      }),
    );
  }
}
