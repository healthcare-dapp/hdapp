import { array, partial, string, TypeOf } from "io-ts";

export const UserOrganizationDetailsDto = partial({
    email_domains: array(string),
    website: string,
});

export type UserOrganizationDetailsDto = TypeOf<typeof UserOrganizationDetailsDto>;
