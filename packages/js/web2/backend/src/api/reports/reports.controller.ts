import { endpoints } from "@hdapp/shared/web2-common/api";
import { UserDto } from "@hdapp/shared/web2-common/dto";
import { ReportDto } from "@hdapp/shared/web2-common/dto/report";
import { web3AddressType, Web3Address } from "@hdapp/shared/web2-common/types";
import { Body, Controller, Get, NotFoundException, Param, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserAdapter } from "../../adapters/user.adapter";
import { JwtAuthGuard } from "../../guards/jwt.guard";
import { UserGuard } from "../../guards/user.guard";
import { IoTsValidationPipe } from "../../utils/io-ts.pipe";
import { Web3AccountManagerService } from "../../web3/account-manager.service";
import { UserNotFoundError, UsersService } from "../users/users.service";

@ApiTags("Reports management")
@Controller()
export class ReportsController {
    constructor(
        private users: UsersService,
        private web3: Web3AccountManagerService,
    ) {}

    @UseGuards(JwtAuthGuard, UserGuard)
    @Get(endpoints.reports.patch_by_id)
    @ApiOperation({ description: "Receive reports from user" })
    async receiveReport(@Body(new IoTsValidationPipe(ReportDto))
        data: ReportDto): Promise<ReportDto> {
        try {
            return data;
        } catch (e) {
            if (e instanceof UserNotFoundError)
                throw new NotFoundException(e.message);

            throw e;
        }
    }
}
