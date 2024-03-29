import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { RedisService } from "../../redis/redis.service";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { LocalStrategy } from "./local.strategy";
import { MailService } from "./mail.service";
import { Web3Strategy } from "./web3.strategy";

@Module({
    imports: [
        UsersModule,
        JwtModule.register({ secret: process.env.JWT_SECRET }),
        PassportModule,
    ],
    providers: [AuthService, JwtStrategy, LocalStrategy, MailService, RedisService, Web3Strategy],
    controllers: [AuthController],
})
export class AuthModule {}
