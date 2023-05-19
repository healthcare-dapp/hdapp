import { FileEntity, UserEntity } from "@hdapp/shared/db-common/entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Web3Module } from "../../web3/web3.module";
import { MailService } from "../auth/mail.service";
import { UsersModule } from "../users/users.module";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
    providers: [MailService, ReportsService],
    controllers: [ReportsController],
    imports: [
        Web3Module,
        UsersModule,
        TypeOrmModule.forFeature([FileEntity, UserEntity]),
    ],
})
export class ReportsModule {}
