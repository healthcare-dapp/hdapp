import { boolean, partial, string, TypeOf } from "io-ts";

export const UserFiltersDto = partial({
    query: string,
    medical_organization_name: string,
    has_doctor_capabilities: boolean,
    is_verified_doctor: boolean,
    is_banned: boolean,
    has_web3_address: boolean,
    areas_of_focus: string,
    location: string,
    organization_id: string,
});

export type UserFiltersDto = TypeOf<typeof UserFiltersDto>;
