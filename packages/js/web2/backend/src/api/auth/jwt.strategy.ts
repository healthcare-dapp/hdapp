import { Injectable, InternalServerErrorException, Logger, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy, StrategyOptions } from "passport-jwt";
import { EntityNotFoundError } from "typeorm";
import { ExtendedRequest } from "../../utils/extended-request";
import { UsersService } from "../users/users.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private _logger = new Logger("JwtStrategy");

    constructor(private users: UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET,
        } as StrategyOptions);
    }

    async validate(payload: { id: string }): Promise<ExtendedRequest["user"]> {
        try {
            const user = await this.users.findOneById(payload.id);
            return user;
        } catch (e) {
            this._logger.warn("Could not validate user.", payload.id, e);

            if (e instanceof EntityNotFoundError)
                throw new UnauthorizedException();

            throw new InternalServerErrorException();
        }
    }
}
