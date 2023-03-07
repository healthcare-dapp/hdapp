import { string, type, TypeOf } from "io-ts";

export const LoginUserDto = type({
    email: string,
    password: string,
});

export type LoginUserDto = TypeOf<typeof LoginUserDto>;

export const LoginUserSuccessDto = type({
    access_token: string,
    refresh_token: string,
});

export type LoginUserSuccessDto = TypeOf<typeof LoginUserSuccessDto>;
