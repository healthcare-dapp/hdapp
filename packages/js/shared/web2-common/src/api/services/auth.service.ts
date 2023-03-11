import { LoginUserDto, LoginUserSuccessDto } from "../../dto/login-user.dto";
import { TokenDto } from "../../dto/token.dto";
import { CreateUserDto } from "../../dto/user.dto";
import { getRightOrFail } from "../../io-ts-utils/get-right";
import { endpoints } from "../endpoints";
import { http } from "../http";

export const AuthService = new (class {
    login(dto: LoginUserDto): Promise<LoginUserSuccessDto> {
        return http.post(endpoints.auth.login, dto)
            .then(r => r.data)
            .then(LoginUserSuccessDto.decode)
            .then(getRightOrFail);
    }

    register(dto: CreateUserDto): Promise<void> {
        return http.post(endpoints.auth.register, dto);
    }

    refreshJwt(dto: TokenDto): Promise<void> {
        return http.post(endpoints.auth.refresh_jwt, dto);
    }

    revokeJwt(dto: TokenDto): Promise<void> {
        return http.post(endpoints.auth.revoke_jwt, dto);
    }

    verifyEmail(): Promise<void> {
        throw new Error("unused.");
    }
});
