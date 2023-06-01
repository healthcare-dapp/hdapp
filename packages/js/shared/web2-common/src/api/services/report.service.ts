import { SendReportDto } from "@hdapp/shared/web2-common/dto/report";
import { endpoints } from "../endpoints";
import { http } from "../http";

export const ReportService = new (class {
    sendReport(report: SendReportDto, id: string | undefined): Promise<void> {
        if (id === undefined)
            id = "";
        return http.request({
            url: endpoints.reports.patch_by_id.replace(":id", id),
            data: report,
        });
    }

});
