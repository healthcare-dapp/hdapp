import { FileEntity } from "@hdapp/shared/db-common/entities";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SnowflakeService } from "../../utils/snowflake.service";
import { MinioService } from "./minio.service";

@Injectable()
export class FileService implements OnModuleInit {
    constructor(
        @InjectRepository(FileEntity)
        private fileRepository: Repository<FileEntity>,
        private minioService: MinioService,
    ) { }

    async onModuleInit() {
        if (!(await this.minioService.hasBucket("main"))) {
            await this.minioService.createBucket("main");
        }
    }

    async uploadFiles(fileOrFiles: Express.Multer.File | Express.Multer.File[]) {
        const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
        return await Promise.all(
            files.map(async file => {
                const id = SnowflakeService.make();
                await this.minioService.uploadToBucket("main", id, file.buffer);
                const fileEntity: FileEntity = {
                    id,
                    fileName: file.originalname,
                    fileSize: file.size,
                };
                await this.fileRepository.insert(fileEntity);
                return fileEntity;
            }),
        );
    }

    async getFile(id: string) {
        return await this.minioService.downloadFromBucket("main", id);
    }
}
