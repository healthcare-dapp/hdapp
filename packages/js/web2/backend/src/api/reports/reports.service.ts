import { FileEntity, ReportEntity } from "@hdapp/shared/db-common/entities";
import { ReportDto, SendReportDto } from "@hdapp/shared/web2-common/dto/report";
import { PagedResponse } from "@hdapp/shared/web2-common/types";
import { FriendlyErrorClass, Logger } from "@hdapp/shared/web2-common/utils";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";
import { FileAdapter } from "../../adapters/file.adapter";
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

    async createReport(user: SendReportDto): Promise<{ success: boolean }> {
        try {
            const sender = await this.users.findOneByWeb3Address(user.address);
            const report = {
                user: sender,
                description: user.report.description,
                status: "Unresolved",
                attachments: user.report.attachment_ids.map(id =>({ id }))
            };
            const response = await this.reports.save(report);
            //await this.reports.save(user);

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
    }

    async updateReport(id: number, newStatus: string, messageToUser: string): Promise<{ success: boolean }> { //messageToUser - Для почты
        try {
            const reportToUpdate = await this.reports.findOne({ where: { id } });
            if (!reportToUpdate) 
                throw new Error("Report not found!");
            reportToUpdate.status = newStatus;
            const response = await this.reports.save(reportToUpdate);
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
    }

    async getReports(): Promise<ReportDto[]> {
        const builder = this.reports.createQueryBuilder("reports").leftJoinAndSelect("reports.attachments", "attachments");
        builder.orderBy("reports.id");
        debug(builder.expressionMap);
        try {
            const dbEntities = await builder.getMany();
            const reportDtos = dbEntities.map(report => {
                const attachments = report.attachments?.map(file => FileAdapter.transformToDto(file));

                return {
                    id: report.id,
                    user_id: report.user.id,
                    description: report.description,
                    attachment_ids: attachments,
                    status: report.status,
                };
            });
            return reportDtos;
        } catch (e) {
            if (e instanceof ReportNotFoundError) {
                throw new ReportNotFoundError(e);
            }
            throw e;
        }
    }

}
