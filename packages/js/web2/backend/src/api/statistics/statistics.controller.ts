import { Controller, Get } from "@nestjs/common";
import { StatisticsService } from "./statistics.service";

@Controller("statistics")
export class StatisticsController {
    constructor(
        private statistics: StatisticsService,
    ) {}

    @Get("/")
    getStatistics() {
        return this.statistics.getStatistics();
    }
}
