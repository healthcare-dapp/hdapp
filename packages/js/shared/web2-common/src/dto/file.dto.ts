import { number, string, type, TypeOf } from "io-ts";

export const FileDto = type({
    id: string,
    file_name: string,
    file_size_in_bytes: number,
});

export type FileDto = TypeOf<typeof FileDto>;
