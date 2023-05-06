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

    download(id: string): Promise<Blob> {
        return http.request({
          method: "GET",
          url: `${endpoints.file.download}/${id}`,
          responseType: "blob"
        }).then(response => response.data);
      }
});
