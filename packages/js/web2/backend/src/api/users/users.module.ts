import { FileEntity, UserEntity } from "@hdapp/shared/db-common/entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Web3Module } from "../../web3/web3.module";
import { MailService } from "../auth/mail.service";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
    exports: [UsersService],
    providers: [MailService, UsersService],
    controllers: [UsersController],
    imports: [
        Web3Module,
        TypeOrmModule.forFeature([FileEntity, UserEntity]),
    ],
})
export class UsersModule {}
