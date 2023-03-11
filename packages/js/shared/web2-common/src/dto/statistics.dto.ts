import { number, type, TypeOf } from "io-ts";

export const StatisticsDto = type({
    users: type({
        total: number,
        active: number,
        new: number,
        totalDoctors: number,
        pending: number,
    }),
});

export type StatisticsDto = TypeOf<typeof StatisticsDto>;
