import { StatisticsDto } from "../../dto/statistics.dto";
import { getRightOrFail } from "../../io-ts-utils/get-right";
import { endpoints } from "../endpoints";
import { http } from "../http";

export const StatisticsService = new (class {
    get(): Promise<StatisticsDto> {
        return http.get(endpoints.statistics.get)
            .then(r => r.data)
            .then(StatisticsDto.decode)
            .then(getRightOrFail);
    }
});
