import { endpoints } from "@hdapp/shared/web2-common/api/endpoints";
import { StatisticsDto } from "@hdapp/shared/web2-common/dto/statistics.dto";
import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UsersService } from "../users/users.service";

@ApiTags("Service statistics")
@Controller()
export class StatisticsController {
    constructor(
        private users: UsersService,
    ) {}

    @Get(endpoints.statistics.get)
    @ApiOperation({ description: "Provide with latest server statistics." })
    @ApiBearerAuth()
    getStatistics(): Promise<StatisticsDto> {
        return this.users.getStatistics();
    }
}
