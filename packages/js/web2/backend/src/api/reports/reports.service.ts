import { FileEntity, ReportEntity } from "@hdapp/shared/db-common/entities";
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

    // transformCreateDtoToEntity(entity: SendReportDto): ReportEntity {
    //     return {
    //         email: entity.email,
    //         birthDate: LocalDate.parse(entity.birth_date),
    //         confirmationDocuments: entity.confirmation_document_ids.map(id => ({ id })),
    //         fullName: entity.full_name,
    //         hasDoctorCapabilities: entity.has_doctor_capabilities,
    //         medicalOrganizationName: entity.medical_organization_name,
    //     };
    // }

    async createRequest(user: SendReportDto): Promise<{ success: boolean }> {
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

        //return await this.findOneByEmail(user.email);
    }

}
