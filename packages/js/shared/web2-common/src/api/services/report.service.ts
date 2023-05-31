import { UpdateUserDto } from "@hdapp/shared/web2-common/dto";
import { CreateReportDto, SendReportDto } from "../../dto/report";
import { UserPublicProfileDto } from "../../dto/user/public-profile.dto";
import { UpdatePublicProfileDto } from "../../dto/user/update-public-profile.dto";
import { UserFiltersDto } from "../../dto/user-filters.dto";
import { CreateUserDto, PublicUserDto, PublicUserSearchFiltersDto, UserDto } from "../../dto/user.dto";
import { PagedResponse } from "../../types/paged-response.type";
import { Web3Address } from "../../types/web3-address.type";
import { endpoints } from "../endpoints";
import { http } from "../http";

export const ReportService = new (class {
    sendReport(report: SendReportDto): Promise<PagedResponse<UserDto>> {
        return http.request({
            url: endpoints.reports.patch_by_id, //Нужно вставить id пользователя
            params: {
                filters: btoa(JSON.stringify(filters)),
                from_id: options?.from_id,
                sort_by: options?.sort_by,
                sort_desc: !!options?.sort_desc,
            },
            type: PagedResponse(UserDto)
        });
    }

});
