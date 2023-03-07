import { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";

export class ResponseInterceptor implements NestInterceptor {
    intercept(_: ExecutionContext, next: CallHandler): Observable<unknown> {
        return next
            .handle()
            .pipe(map(data => ({ message: "OK.", data: data ?? null })));
    }
}
