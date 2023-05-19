import { ReportEntity } from "@hdapp/shared/db-common/entities";
import { FriendlyErrorClass, Logger } from "@hdapp/shared/web2-common/utils";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Web3AccountManagerService } from "../../web3/account-manager.service";
import { MailService } from "../auth/mail.service";
import { UsersService } from "../users/users.service";

export class ReportNotFoundError extends FriendlyErrorClass("Report does not exist") {}
export class ReportUpdateDetailsNotUniqueError extends FriendlyErrorClass() {}

const { error, debug } = new Logger("reports-service");

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(ReportEntity)
        private reports: Repository<ReportEntity>,
        private users: UsersService,
        private mail: MailService,
        private web3: Web3AccountManagerService,
    ) { }

}
