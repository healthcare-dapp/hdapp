import { array, number, partial, string, type, TypeOf } from "io-ts";

export const CreateReportDto = type({
    description: string,
    attachment_ids: array(string),
});

export type CreateReportDto = TypeOf<typeof CreateReportDto>;

export const ReportDto = type({
    id: number,
    user_id: number,
    description: string,
    attachment_ids: array(string),
    status: string,
});

export type ReportDto = TypeOf<typeof ReportDto>;
