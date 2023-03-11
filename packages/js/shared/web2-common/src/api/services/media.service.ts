import { array } from "io-ts";
import { FileDto } from "../../dto/file.dto";
import { getRightOrFail } from "../../io-ts-utils/get-right";
import { endpoints } from "../endpoints";
import { http } from "../http";

export const MediaService = new (class {
    upload(data: FormData): Promise<FileDto[]> {
        return http.post(endpoints.file.upload, data)
            .then(r => r.data)
            .then(array(FileDto).decode)
            .then(getRightOrFail);
    }
});
