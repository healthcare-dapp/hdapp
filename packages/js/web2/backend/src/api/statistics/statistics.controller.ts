import { endpoints } from "@hdapp/shared/web2-common/api/endpoints";
import { StatisticsDto } from "@hdapp/shared/web2-common/dto/statistics.dto";
import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { StatisticsService } from "./statistics.service";

@ApiTags("Service statistics")
@Controller()
export class StatisticsController {
    constructor(
        private statistics: StatisticsService,
    ) {}

    @Get(endpoints.statistics.get)
    @ApiOperation({ description: "Provide with latest server statistics." })
    @ApiBearerAuth()
    getStatistics(): Promise<StatisticsDto> {
        return this.statistics.getStatistics();
    }
}
