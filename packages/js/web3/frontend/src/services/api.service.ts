import { UserDto } from "@hdapp/shared/web2-common/dto";
import { getRightOrFail } from "@hdapp/shared/web2-common/io-ts-utils";
import axios from "axios";

const api = axios.create({
    baseURL: "https://hdapp.ruslang.xyz/api/"
});

export class ApiService {
    async getUserByWeb3Address(web3Address: string): Promise<UserDto> {
        return await api.get("/users/by_web3_address/" + web3Address)
            .then(r => r.data)
            .then(UserDto.decode)
            .then(getRightOrFail);
    }
}

export const apiService = new ApiService();
