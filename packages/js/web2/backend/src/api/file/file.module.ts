import { FileEntity } from "@hdapp/shared/db-common/entities";
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MulterModule } from "@nestjs/platform-express";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as multer from "multer";
import { FileController } from "./file.controller";
import { FileService } from "./file.service";
import { MinioService } from "./minio.service";

@Module({
    providers: [FileService, MinioService],
    imports: [
        MulterModule.register({ storage: multer.memoryStorage() }),
        TypeOrmModule.forFeature([FileEntity]),
        JwtModule.register({ secret: process.env.JWT_SECRET }),
    ],
    controllers: [FileController],
})
export class FileModule {}
