import {
    BadRequestException,
    Controller,
    Get,
    Param,
    Post,
    Response,
    UploadedFiles,
    UseInterceptors,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response as ExpressResponse } from "express";
import { FileAdapter } from "../../db/adapters/file.adapter";
import { FileService } from "./file.service";

@ApiTags("File management")
@Controller("/api/media")
export class FileController {
    constructor(private fileService: FileService) { }

    // @UserMatcher({ has_moderator_capabilities: true })
    // @UseGuards(JwtAuthGuard, UserGuard)
    @Get("download/:id/:name")
    @ApiOperation({ description: "Download a file from the server." })
    @ApiBearerAuth()
    async downloadFile(@Param("id") id: string, @Response() response: ExpressResponse) {
        try {
            (await this.fileService.getFile(id)).pipe(response);
        } catch (e) {
            if (e instanceof Error) {
                throw new BadRequestException(e.message);
            }
            throw e;
        }
    }

    @Post("upload")
    @UseInterceptors(FileFieldsInterceptor([{ name: "files", maxCount: 10 }]))
    @ApiOperation({ description: "Uploads files to the server." })
    @ApiBearerAuth()
    async uploadFiles(@UploadedFiles() { files }: { files: Express.Multer.File[] }) {
        try {
            const uploadedFiles = await this.fileService.uploadFiles(files);
            return uploadedFiles.map(FileAdapter.transformToDto);
        } catch (e) {
            if (e instanceof Error)
                throw new BadRequestException(e.message);

            throw e;
        }
    }
}
