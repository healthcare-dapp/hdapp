import { EmailAddress, Web3Address } from "@hdapp/shared/web2-common/types";
import { LocalDate } from "@js-joda/core";
import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { LocalDateTransformer } from "../transformers/local-date.transformer";
import { FileEntity } from "./file.entity";

@Entity()
export class UserEntity {
    @PrimaryGeneratedColumn()
    @ApiProperty({
        description: "Snowflake-generated user ID",
        readOnly: true,
    })
        id: string;

    @Column({ type: "varchar", nullable: true, unique: true })
    @ApiProperty({ description: "User's address (public key) in Ethereum blockchain" })
        web3Address: Web3Address | null;

    @Column({ unique: true })
    @ApiProperty({ description: "User's email address" })
        email: EmailAddress;

    @Column({ nullable: true, type: "varchar" })
    @ApiProperty({ description: "BCrypt-hashed user password" })
        password: string | null;

    @Column({ type: "date", transformer: LocalDateTransformer })
    @ApiProperty({ description: "User's date of birth" })
        birthDate: LocalDate;

    @Column()
    @ApiProperty({ description: "User's full name" })
        fullName: string;

    @Column()
    @ApiProperty({ description: "True if user is a doctor" })
        hasDoctorCapabilities: boolean;

    @Column({ default: false })
    @ApiProperty({ description: "True if user is a moderator" })
        hasModeratorCapabilities: boolean;

    @Column({ default: false })
    @ApiProperty({ description: "True if user is a administrator" })
        hasAdministratorCapabilities: boolean;

    @Column({ default: false })
    @ApiProperty({ description: "True if user has verified their email" })
        hasVerifiedEmail: boolean;

    @Column({ default: false })
    @ApiProperty({ description: "True if user has been verified to be a doctor" })
        isVerifiedDoctor: boolean;

    @Column({ default: false })
    @ApiProperty({ description: "True if user has been banned from the smart contracts" })
        isBanned: boolean;

    @Column({ nullable: true, type: "varchar" })
    @ApiProperty({ description: "Medical organization name the user is assigned to" })
        medicalOrganizationName: string | null;

    @ManyToMany(() => FileEntity)
    @JoinTable()
        confirmationDocuments?: FileEntity[];
}

export type CreateUserEntity = {
    email: EmailAddress
    birthDate: LocalDate
    confirmationDocuments: { id: string }[]
    fullName: string
    hasDoctorCapabilities: boolean
    medicalOrganizationName: string | null
};
