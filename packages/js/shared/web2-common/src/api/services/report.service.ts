
import { ReportDto, SendReportDto } from "../../dto/report";
import { endpoints } from "../endpoints";
import { http } from "../http";

export const ReportService = new (class {
    fileNewReport(report: SendReportDto, id: string | undefined): Promise<void> {
        if (id === undefined)
            id = "";
        return http.request({
            method: "POST",
            url: endpoints.reports.patch_by_id.replace(":id", id),
            data: report,
        });
    }

    updateReport(reportid: number, newStatus: string, messageToUser: string): Promise<void> {
        return http.request({
            method: "PATCH",
            url: endpoints.reports.patch_by_id.replace(":id", reportid.toString()),
            data: { newStatus, messageToUser }
        });
    }

    async getReports(): Promise<ReportDto[]> {
        const response = await http.request<ReportDto[]>({
            method: "GET",
            url: endpoints.reports.find_paged,
        });
        console.log(response);
        return response;
    }

});
