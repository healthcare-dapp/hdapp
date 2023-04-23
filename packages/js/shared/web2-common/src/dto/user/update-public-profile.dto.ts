import { type, string, TypeOf, any } from "io-ts";
import { web3AddressType } from "../../types/web3-address.type";
import { UserPublicProfileDto } from "./public-profile.dto";

export const UpdatePublicProfileDto = type({
    address: web3AddressType,
    message: any,
    signed: string,
    public_profile: UserPublicProfileDto
});

export type UpdatePublicProfileDto = TypeOf<typeof UpdatePublicProfileDto>;
