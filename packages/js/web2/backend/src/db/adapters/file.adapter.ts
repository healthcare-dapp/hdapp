import { FileEntity } from "@hdapp/shared/db-common/entities";
import { FileDto } from "@hdapp/shared/web2-common/dto";

export const FileAdapter = new class {
    transformToDto(entity: FileEntity): FileDto {
        return {
            id: entity.id,
            file_name: entity.fileName,
            file_size_in_bytes: entity.fileSize,
        };
    }
};
