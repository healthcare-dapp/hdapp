import { Logger } from "@hdapp/shared/web2-common/utils";
import { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { gray } from "colors";
import { Request } from "express";
import { Observable, tap } from "rxjs";
import { URLSearchParams } from "url";

const { debug } = new Logger("performance");

export class PerformanceLoggingInterceptor implements NestInterceptor {
    intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = ctx.switchToHttp().getRequest<Request>();

        const now = Date.now();
        return next.handle().pipe(
            tap(() => {
                const params = new URLSearchParams(request.params).toString();
                debug(
                    gray(request.method + " "
                        + request.path + (params ? "?" + params : "") + " "
                        + `Finished in ${Date.now() - now}ms.`),
                );
            }),
        );
    }
}
