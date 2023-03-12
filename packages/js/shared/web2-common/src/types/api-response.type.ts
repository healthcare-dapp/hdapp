import { Mixed, string, type } from "io-ts";

export interface ApiResponse<D> {
    data: D
    message: string
}

export const ApiResponse = (data: Mixed) => {
    return type({
        data,
        message: string
    });
};
