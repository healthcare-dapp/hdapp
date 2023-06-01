import { endpoints } from "@hdapp/shared/web2-common/api";
import { UserDto, UserFiltersDto } from "@hdapp/shared/web2-common/dto";
import { CreateReportDto, ReportDto, SendReportDto } from "@hdapp/shared/web2-common/dto/report";
import { web3AddressType, Web3Address, PagedResponse } from "@hdapp/shared/web2-common/types";
import { FriendlyErrorClass, Logger } from "@hdapp/shared/web2-common/utils";
import { Body, Controller, Get, NotFoundException, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserAdapter } from "../../adapters/user.adapter";
import { JwtAuthGuard } from "../../guards/jwt.guard";
import { UserMatcher } from "../../guards/user-matcher.decorator";
import { UserGuard } from "../../guards/user.guard";
import { Base64Pipe } from "../../utils/base64.pipe";
import { IoTsValidationPipe } from "../../utils/io-ts.pipe";
import { Web3AccountManagerService } from "../../web3/account-manager.service";
import { UserNotFoundError, UsersService } from "../users/users.service";
import { ReportsService } from "./reports.service";

@ApiTags("Reports management")
@Controller()
export class ReportsController {
    constructor(
        private users: UsersService,
        private web3: Web3AccountManagerService,
        private reports: ReportsService
    ) {}

    @UseGuards(JwtAuthGuard, UserGuard)
    @Post(endpoints.reports.patch_by_id)
    @ApiOperation({ description: "Receive report from user" })
    async receiveReport(
        @Param("id") id: string,
            @Body() report: SendReportDto,
    ): Promise<{ success: boolean }> {
        await this.reports.createRequest(report);
        return { success: true };
    }
    catch(e: typeof FriendlyErrorClass) {
        console.log(e);
        return { success: false };
    }

    @UserMatcher({ hasModeratorCapabilities: true })
    @UseGuards(JwtAuthGuard, UserGuard)
    @Get(endpoints.reports.find_paged)
    @ApiOperation({ description: "Retrieve all reports" })
    @ApiBearerAuth()
    async getAllReports(): Promise<ReportDto[]> {
        const result = await this.reports.getReports();
        return result;
    }

    // @UserMatcher({ hasModeratorCapabilities: true })
    // @UseGuards(JwtAuthGuard, UserGuard)
    // @Get(endpoints.users.find_by_id)
    // @ApiOperation({ description: "Retrieve a user by their ID." })
    // async getAllReports(@Param("id") id: string): Promise<UserDto> {
    //     try {
    //         return UserAdapter.transformToDto(
    //             await this.users.findOneById(id),
    //         );
    //     } catch (e) {
    //         if (e instanceof UserNotFoundError)
    //             throw new NotFoundException(e.message);

    //         throw e;
    //     }
    // }
}

