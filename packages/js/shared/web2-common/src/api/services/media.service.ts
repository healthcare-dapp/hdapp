import { array } from "io-ts";
import { FileDto } from "../../dto/file.dto";
import { endpoints } from "../endpoints";
import { http } from "../http";

export const MediaService = new (class {
    upload(data: FormData): Promise<FileDto[]> {
        return http.request({
            url: endpoints.file.upload,
            data,
            type: array(FileDto)
        });
    }
});