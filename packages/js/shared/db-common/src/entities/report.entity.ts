/* eslint-disable linebreak-style */
import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { FileEntity } from "./file.entity";
import { UserEntity } from "./user.entity";

@Entity()
export class ReportEntity {
    @PrimaryGeneratedColumn()
    @ApiProperty({
        description: "Report ID",
        readOnly: true,
    })
        id: number;

    @ManyToOne(() => UserEntity)
    @ApiProperty({
        description: "User that created the report",
        readOnly: true,
    })
        user: UserEntity;

    @Column()
    @ApiProperty({ description: "Report description" })
        description: string;

    @ManyToMany(() => FileEntity)
    @JoinTable()
        attachments?: FileEntity[];

    @Column()
    @ApiProperty({ description: "Report status" })
        status: string;
}
