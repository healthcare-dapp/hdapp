import { LoginUserDto, LoginUserSuccessDto } from "../../dto/login-user.dto";
import { TokenDto } from "../../dto/token.dto";
import { CreateUserDto } from "../../dto/user.dto";
import { endpoints } from "../endpoints";
import { http } from "../http";

export const AuthService = new (class {
    login(data: LoginUserDto): Promise<LoginUserSuccessDto> {
        return http.request({
            method: "POST",
            url: endpoints.auth.login,
            data,
            type: LoginUserSuccessDto
        });
    }

    register(data: CreateUserDto): Promise<void> {
        return http.request({
            method: "POST",
            url: endpoints.auth.register,
            data
        });
    }

    refreshJwt(data: TokenDto): Promise<void> {
        return http.request({
            method: "POST",
            url: endpoints.auth.refresh_jwt,
            data
        });
    }

    revokeJwt(data: TokenDto): Promise<void> {
        return http.request({
            method: "POST",
            url: endpoints.auth.revoke_jwt,
            data
        });
    }

    verifyEmail(): Promise<void> {
        throw new Error("unused.");
    }
});
