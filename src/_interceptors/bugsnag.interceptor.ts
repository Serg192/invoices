import {
  ExecutionContext,
  Injectable,
  NestInterceptor,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import bugsnag from '@bugsnag/js';

@Injectable()
export class BugsnagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    const clientIp = request.ip;
    const headers = request.headers;
    const body = request.body;
    const endpoint = request.originalUrl;
    const user = {
      _id: request.user?._id,
      email: request.user?.email,
    };

    return next.handle().pipe(
      tap(null, (exception) => {
        bugsnag.notify(exception, (event) => {
          event.addMetadata('Request', {
            clientIp,
            headers,
            body,
            endpoint,
            user,
          });
        });
      }),
    );
  }
}
