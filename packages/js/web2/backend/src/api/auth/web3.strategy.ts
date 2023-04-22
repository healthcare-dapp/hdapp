import { UserEntity } from "@hdapp/shared/db-common/entities";
import { getRightOrFail } from "@hdapp/shared/web2-common/io-ts-utils/get-right";
import { web3AddressType } from "@hdapp/shared/web2-common/types";
import { FriendlyError } from "@hdapp/shared/web2-common/utils";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import Strategy from "passport-dapp-web3";
import { UsersService } from "../users/users.service";

@Injectable()
export class Web3Strategy extends PassportStrategy(Strategy) {
    constructor(private users: UsersService) {
        super({ session: false });
    }

    async validate(address: string): Promise<UserEntity> {
        try {
            const web3Address = getRightOrFail(web3AddressType.decode(address));
            return await this.users.findOneByWeb3Address(web3Address);
        } catch (e) {
            if (e instanceof FriendlyError)
                throw new UnauthorizedException({ message: e.message });

            throw e;
        }
    }
}
