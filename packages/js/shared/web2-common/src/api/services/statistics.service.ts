import { StatisticsDto } from "../../dto/statistics.dto";
import { endpoints } from "../endpoints";
import { http } from "../http";

export const StatisticsService = new (class {
    get(): Promise<StatisticsDto> {
        return http.request({
            url: endpoints.statistics.get,
            type: StatisticsDto
        });
    }
});
