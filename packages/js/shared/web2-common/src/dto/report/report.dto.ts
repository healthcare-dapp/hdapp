import { array, number, partial, string, type, TypeOf } from "io-ts";
import { orUndefined } from "../../io-ts-utils";
import { FileDto } from "../file.dto";

export const CreateReportDto = type({
    description: string,
    attachment_ids: array(string),
});

export type CreateReportDto = TypeOf<typeof CreateReportDto>;

export const ReportDto = type({
    id: number,
    user_id: string,
    description: string,
    attachment_ids: orUndefined(array(FileDto)),
    status: string,
});

export type ReportDto = TypeOf<typeof ReportDto>;
