import { UserEntity } from "@hdapp/shared/db-common/entities";
import { EmailAddress } from "@hdapp/shared/web2-common/types";
import { FriendlyError } from "@hdapp/shared/web2-common/utils";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, IStrategyOptions } from "passport-local";
import { AuthService } from "./auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private auth: AuthService) {
        super({ usernameField: "email" } as IStrategyOptions);
    }

    async validate(email: EmailAddress, password: string): Promise<UserEntity> {
        try {
            return await this.auth.validateUser(email, password);
        } catch (e) {
            if (e instanceof FriendlyError)
                throw new UnauthorizedException({ message: e.message });

            throw e;
        }
    }
}
