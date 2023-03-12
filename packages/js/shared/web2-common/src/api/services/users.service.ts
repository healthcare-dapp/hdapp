import { UserFiltersDto } from "../../dto/user-filters.dto";
import { UserDto } from "../../dto/user.dto";
import { PagedResponse } from "../../types/paged-response.type";
import { Web3Address } from "../../types/web3-address.type";
import { endpoints } from "../endpoints";
import { http } from "../http";

export interface FindPagedOptions {
    from_id?: string
    sort_by?: string
    sort_desc?: boolean
}

export const UsersService = new (class {
    findPaged(filters: UserFiltersDto, options?: FindPagedOptions): Promise<PagedResponse<UserDto>> {
        return http.request({
            url: endpoints.users.find_paged,
            params: {
                filters: btoa(JSON.stringify(filters)),
                from_id: options?.from_id,
                sort_by: options?.sort_by,
                sort_desc: !!options?.sort_desc,
            },
            type: PagedResponse(UserDto)
        });
    }

    // Unsure what to do with web3Address type yet.
    findByWeb3Address(address: string | Web3Address): Promise<UserDto> {
        return http.request({
            url: endpoints.users.find_by_web3_address
                .replace(":address", address),
            type: UserDto
        });
    }
});
