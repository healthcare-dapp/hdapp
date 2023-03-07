import { string, type, TypeOf } from "io-ts";

export const TokenDto = type({
    access_token: string,
    refresh_token: string,
});

export type TokenDto = TypeOf<typeof TokenDto>;
