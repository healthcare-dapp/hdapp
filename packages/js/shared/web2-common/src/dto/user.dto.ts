import { array, boolean, number, partial, record, string, tuple, type, TypeOf } from "io-ts";
import { orNull } from "../io-ts-utils/or-null";
import { orUndefined } from "../io-ts-utils/or-undefined";
import { emailAddressType } from "../types/email-address.type";
import { web3AddressType } from "../types/web3-address.type";
import { FileDto } from "./file.dto";
import { UserOrganizationDetailsDto } from "./user/organization-details.dto";
import { UserPublicProfileDto } from "./user/public-profile.dto";

export const UserDto = type({
    id: number,
    web3_address: orNull(web3AddressType),
    email: emailAddressType,
    full_name: string,
    birth_date: string,
    confirmation_documents: orUndefined(array(FileDto)),
    medical_organization_name: orUndefined(string),
    has_doctor_capabilities: boolean,
    has_moderator_capabilities: boolean,
    has_administrator_capabilities: boolean,
    has_organization_capabilities: boolean,
    has_verified_email: boolean,
    is_verified_doctor: boolean,
    is_banned: boolean,
    organization_details: orUndefined(UserOrganizationDetailsDto),
    public_profile: orUndefined(UserPublicProfileDto),
});

export type UserDto = TypeOf<typeof UserDto>;

export const PublicUserDto = type({
    web3_address: orNull(web3AddressType),
    public_profile: orUndefined(UserPublicProfileDto),
});

export type PublicUserDto = TypeOf<typeof PublicUserDto>;

export const PublicUserSearchFiltersDto = type({
    areas_of_focus: array(type({ value: string, count: number })),
    locations: array(type({ value: string, count: number })),
    organizations: array(type({ id: string, name: string, count: number })),
});

export type PublicUserSearchFiltersDto = TypeOf<typeof PublicUserSearchFiltersDto>;

export const CreateUserDto = type({
    email: emailAddressType,
    full_name: string,
    birth_date: string,
    medical_organization_name: orNull(string),
    confirmation_document_ids: array(string),
    has_doctor_capabilities: boolean,
});

export type CreateUserDto = TypeOf<typeof CreateUserDto>;

export const UpdateUserDto = partial({
    web3_address: web3AddressType,
    email: emailAddressType,
    password: string,
    full_name: string,
    birth_date: string,
    medical_organization_name: orNull(string),
    confirmation_documents: orUndefined(array(FileDto)),
    has_doctor_capabilities: boolean,
    has_moderator_capabilities: boolean,
    has_administrator_capabilities: boolean,
    has_verified_email: boolean,
    is_verified_doctor: boolean,
    is_banned: boolean,
    is_organization: boolean,
    organization_details: UserOrganizationDetailsDto,
});

export type UpdateUserDto = TypeOf<typeof UpdateUserDto>;

export const SelfUpdateUserDto = partial({
    email: emailAddressType,
    password: string,
});

export type SelfUpdateUserDto = TypeOf<typeof SelfUpdateUserDto>;
