import { array, partial, record, string, type, TypeOf } from "io-ts";

export const UserPublicProfileDto = partial({
    full_name: string,
    avatar: string,
    organization_id: string,
    location: string,
    languages: array(string),
    areasOfFocus: string,
    specialty: string,
    timetable: array(array(string)),
    socials: array(type({ name: string, value: string }))
});

export type UserPublicProfileDto = TypeOf<typeof UserPublicProfileDto>;
