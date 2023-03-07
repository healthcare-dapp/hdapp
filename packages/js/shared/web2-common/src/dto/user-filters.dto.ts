import { boolean, partial, string, TypeOf } from "io-ts";

export const UserFiltersDto = partial({
    query: string,
    medical_organization_name: string,
    has_doctor_capabilities: boolean,
    is_verified_doctor: boolean,
    is_banned: boolean,
    has_web3_address: boolean,
});

export type UserFiltersDto = TypeOf<typeof UserFiltersDto>;
