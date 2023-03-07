import { UserEntity } from "@hdapp/shared/db-common/entities";
import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ExtendedRequest } from "../utils/extended-request";

@Injectable()
export class UserGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const matchers = this.reflector.get<Partial<UserEntity>[]>("matchers", context.getHandler());
        const { user } = context.switchToHttp().getRequest<ExtendedRequest>();

        for (const matcher of matchers) {
            const keys = Object.keys(matcher) as (keyof UserEntity)[];
            for (const key of keys)
                if (user[key] !== matcher[key])
                    throw new ForbiddenException(
                        "You do not have enough permissions to perform this action.",
                    );
        }

        return true;
    }
}
