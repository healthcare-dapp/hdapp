import { ReportEntity } from "@hdapp/shared/db-common/entities";
import { ReportDto, SendReportDto } from "@hdapp/shared/web2-common/dto/report";
import { FriendlyErrorClass, Logger } from "@hdapp/shared/web2-common/utils";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";
import { Web3AccountManagerService } from "../../web3/account-manager.service";
import { MailService } from "../auth/mail.service";
import { UserUpdateDetailsNotUniqueError, UsersService } from "../users/users.service";

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

    async createRequest(user: SendReportDto): Promise<{ success: boolean }> {
        try {
            const sender = await this.users.findOneByWeb3Address(user.address);
            const report = new ReportEntity();
            report.user = sender;
            report.description = user.report.description;
            report.status = "Unresolved";
            const response = await this.reports.save(report);
            debug("Response");
            debug(response);
            return { success: true };
        } catch (e) {
            if (e instanceof QueryFailedError) {
                error(e);
                throw new UserUpdateDetailsNotUniqueError(e, "Provided details are not unique");
            }

            throw e;
        }

        //return await this.findOneByEmail(user.email);
    }

}
