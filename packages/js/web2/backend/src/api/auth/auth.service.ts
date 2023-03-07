import { CreateUserEntity, UserEntity } from "@hdapp/shared/db-common/entities";
import { EmailAddress } from "@hdapp/shared/web2-common/types";
import { FriendlyErrorClass, Logger } from "@hdapp/shared/web2-common/utils";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RedisService } from "../../redis/redis.service";
import { SnowflakeService } from "../../utils/snowflake.service";
import { UserNotFoundError, UsersService } from "../users/users.service";
import { MailService } from "./mail.service";

export class AdminLoginFailedError extends FriendlyErrorClass("Username and/or password are incorrect") {}
export class JwtTokenRevokedError extends FriendlyErrorClass("This refresh token was revoked") {}
export class EmailVerificationError extends FriendlyErrorClass("The verification link provided is not valid or has expired") {}

const { debug } = new Logger("auth-service");

@Injectable()
export class AuthService {
    constructor(
        private users: UsersService,
        private jwt: JwtService,
        private mail: MailService,
        private redis: RedisService,
    ) { }

    async validateUser(
        email: EmailAddress,
        password: string,
    ): Promise<UserEntity> {
        try {
            const user = await this.users.findOneByEmail(email);

            if (user.password !== password)
                throw new AdminLoginFailedError();

            if (!user.hasModeratorCapabilities && !user.hasAdministratorCapabilities)
                throw new AdminLoginFailedError("Your account has no access to this system");

            return user;
        } catch (e) {
            if (e instanceof UserNotFoundError)
                throw new AdminLoginFailedError();

            throw e;
        }
    }

    login(user: UserEntity) {
        const payload = { id: user.id };
        return this.jwt.sign(payload);
    }

    async register(user: CreateUserEntity) {
        const fullUser = await this.users.createOne(user);

        const token = this._generateEmailVerificationJwtToken(fullUser);
        await this.mail.sendEmailVerification(user.email, token);
    }

    async verifyEmail(user: UserEntity) {
        if (user.hasDoctorCapabilities) {
            await this.mail.sendReviewNoticeEmail(user.email);
            return;
        }

        await this.users.createWalletForUser(user);
    }

    private _generateEmailVerificationJwtToken(user: { id: string; email: string }) {
        const payload = { id: user.id, email: user.email };
        return this.jwt.sign(payload);
    }

    generateJwtToken(user: UserEntity): [string, string] {
        return [
            this.jwt.sign({ id: user.id }, { expiresIn: "1d" }),
            this.jwt.sign(SnowflakeService.make()),
        ];
    }

    async refreshJwtToken(accessToken: string, refreshToken: string): Promise<[string, string]> {
        const isRevoked = (await this.redis.exists(`revoked_token-${refreshToken}`)) > 0;

        if (isRevoked)
            throw new JwtTokenRevokedError();

        const { id } = this.jwt.verify<{ id: number }>(accessToken);
        return [
            this.jwt.sign({ id }, { expiresIn: "1d" }),
            this.jwt.sign(SnowflakeService.make()),
        ];
    }

    async revokeJwtToken(refreshToken: string) {
        const isRevoked = (await this.redis.exists(`revoked_token-${refreshToken}`)) > 0;

        if (isRevoked)
            throw new JwtTokenRevokedError();

        await this.redis.set(`revoked_token-${refreshToken}`, Date.now());
    }

    async verifyEmailByJwtToken(token: string) {
        try {
            const { id, email } = this.jwt.verify<{ id: string; email: string }>(token);
            const user = await this.users.findOneById(id);

            if (user.hasVerifiedEmail) {
                debug("E-mail verification for user", id, "failed.", "The user was verified before.");
                throw new EmailVerificationError();
            }
            if (user.email !== email) {
                debug("E-mail verification for user", id, "failed.", "The e-mail in the JWT token does not match user's e-mail.");
                throw new EmailVerificationError();
            }

            await this.users.updateOne(id, { hasVerifiedEmail: true });

            if (user.hasDoctorCapabilities)
                await this.mail.sendReviewNoticeEmail(user.email);
            else
                await this.users.createWalletForUser(user);
        } catch (e) {
            if (e instanceof UserNotFoundError)
                throw new EmailVerificationError();

            throw e;
        }
    }
}
