import { UserEntity } from "@hdapp/shared/db-common/entities/user.entity";
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

    updateUser(user: UserDto): Promise<UserDto> {
        return http.request({
            data: { web3_address: user.web3_address,
                email: user.email,
                full_name: "CHANGE NOW",
                birth_date: user.birth_date,
                medical_organization_name: user.medical_organization_name,
                confirmation_documents: user.confirmation_documents,
                has_doctor_capabilities: user.has_doctor_capabilities,
                has_moderator_capabilities: user.has_moderator_capabilities,
                has_administrator_capabilities: user.has_administrator_capabilities,
                has_verified_email: user.has_verified_email,
                is_verified_doctor: user.is_verified_doctor,
                is_banned: user.is_banned,
            },
            url: endpoints.users.patch_by_id.replace(":id", user.id.toString()),
            type: UserDto
        });
    }
});
