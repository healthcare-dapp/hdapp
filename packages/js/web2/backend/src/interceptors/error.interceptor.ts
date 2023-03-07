import { FriendlyError, Logger } from "@hdapp/shared/web2-common/utils";
import {
    BadRequestException,
    CallHandler,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";
import { catchError, Observable, throwError } from "rxjs";

const { error } = new Logger("general");

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
    intercept(_: ExecutionContext, next: CallHandler): Observable<Error> {
        return next
            .handle()
            .pipe(
                catchError(err =>
                    throwError(() => {
                        if (err instanceof FriendlyError)
                            return new BadRequestException(err.message);

                        if (err instanceof HttpException)
                            return err;

                        error(err);
                        return new HttpException("Unknown server error", HttpStatus.INTERNAL_SERVER_ERROR);
                    }),
                ),
            );
    }
}
