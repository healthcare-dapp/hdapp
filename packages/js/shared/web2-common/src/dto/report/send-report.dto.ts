import { any, string, type, TypeOf } from "io-ts";
import { web3AddressType } from "../../types/web3-address.type";
import { CreateReportDto } from "./report.dto";

export const SendReportDto = type({
    address: web3AddressType,
    message: any,
    signed: string,
    report: CreateReportDto
});

export type SendReportDto = TypeOf<typeof SendReportDto>;
