import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '@/modules/audit/audit.service';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(@Inject(AuditService) private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const path = request.path;
    const user = request.user as any;

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.auditService.log({
            action: method,
            entityType: this.extractEntityType(path),
            entityId: this.extractEntityId(path),
            userId: user?.id,
            oldData: null,
            newData: null,
            req: request,
          });
        } catch (error) {
          console.error('Failed to log audit:', error);
        }
      }),
    );
  }

  private extractEntityType(path: string): string {
    const parts = path.split('/').filter(Boolean);
    if (parts.length > 1) {
      return parts[1];
    }
    return 'unknown';
  }

  private extractEntityId(path: string): string | null {
    const parts = path.split('/').filter(Boolean);
    if (parts.length > 2 && parts[1] !== 'auth') {
      return parts[2];
    }
    return null;
  }
}
