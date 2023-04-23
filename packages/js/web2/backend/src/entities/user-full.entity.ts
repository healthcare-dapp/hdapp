import { UserEntity } from "@hdapp/shared/db-common/entities/user.entity";
import { ApiProperty } from "@nestjs/swagger";

export class Web3UserEntity {
    @ApiProperty({ description: "True if user has been verified to be a doctor" })
        isVerifiedDoctor: boolean;

    @ApiProperty({ description: "True if user has been banned from the smart contracts" })
        isBanned: boolean;

    @ApiProperty({ description: "True if user has agreed to disclose their profile info" })
        isProfilePublic: boolean;
}

// It's not an actual database entity, rather, it's a concatenation of a
// database entity and an entity in web3.
export type UserFullEntity = UserEntity & Web3UserEntity;
