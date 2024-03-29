import { AxiosResponse } from "axios";
import { Response as ExpressResponse } from "express";
import { array } from "io-ts";
import { FileDto } from "../../dto/file.dto";
import { endpoints } from "../endpoints";
import { http } from "../http";

export const MediaService = new (class {
    upload(data: FormData): Promise<FileDto[]> {
        return http.request({
            method: "POST",
            url: endpoints.file.upload,
            data,
            type: array(FileDto)
        });
    }

    async download(id: string, fileName: string): Promise<Blob> {
        const response = await http.request<AxiosResponse<Blob>>({
            method: "GET",
            url: endpoints.file.download.replace(":id", id).replace(":name", fileName),
            responseType: "blob"
        });
        return response.data;
    }
});
