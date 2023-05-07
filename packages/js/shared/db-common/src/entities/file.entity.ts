import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class FileEntity {
    @PrimaryColumn({
        type: "varchar",
        unique: true,
    })
    @ApiProperty({
        description: "Snowflake-generated file ID.",
        readOnly: true,
    })
        id: string;

    @Column()
    @ApiProperty({ description: "File name." })
        fileName: string;

    @Column()
    @ApiProperty({ description: "File size in bytes." })
        fileSize: number;
}
