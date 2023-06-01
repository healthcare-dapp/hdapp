import { endpoints } from "@hdapp/shared/web2-common/api";
import { UserDto } from "@hdapp/shared/web2-common/dto";
import { CreateReportDto, ReportDto, SendReportDto } from "@hdapp/shared/web2-common/dto/report";
import { web3AddressType, Web3Address } from "@hdapp/shared/web2-common/types";
import { FriendlyErrorClass, Logger } from "@hdapp/shared/web2-common/utils";
import { Body, Controller, Get, NotFoundException, Param, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserAdapter } from "../../adapters/user.adapter";
import { JwtAuthGuard } from "../../guards/jwt.guard";
import { UserGuard } from "../../guards/user.guard";
import { IoTsValidationPipe } from "../../utils/io-ts.pipe";
import { Web3AccountManagerService } from "../../web3/account-manager.service";
import { UserNotFoundError, UsersService } from "../users/users.service";
import { ReportsService } from "./reports.service";
import { UserMatcher } from "../../guards/user-matcher.decorator";

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
    @ApiOperation({ description: "Receive reports from user" })
    async receiveReport(
        @Param("id") id: string,
            @Body() report: SendReportDto,
    ): Promise<{ success: boolean }> 
    {
        await this.reports.createRequest(report);
        return { success: true };
    }
    catch(e: typeof FriendlyErrorClass) {
        console.log(e);
        return { success: false };
    }

    // @UserMatcher({ hasModeratorCapabilities: true })
    // @UseGuards(JwtAuthGuard, UserGuard)
    // @Get(endpoints.users.find_by_id)
    // @ApiOperation({ description: "Retrieve a user by their ID." })
    // async getUserById(@Param("id") id: string): Promise<UserDto> {
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

