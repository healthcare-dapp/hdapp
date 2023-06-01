import { CreateUserEntity } from "@hdapp/shared/db-common/entities";
import { CreateUserDto, PublicUserDto, UpdateUserDto, UserDto } from "@hdapp/shared/web2-common/dto";
import { LocalDate } from "@js-joda/core";
import { DeepPartial } from "typeorm";
import { UserFullEntity } from "../entities/user-full.entity";
import { FileAdapter } from "./file.adapter";

export const UserAdapter = new (class {
    transformToDto(entity: UserFullEntity): UserDto {
        if (entity.hasDoctorCapabilities)
            console.log(entity.confirmationDocuments?.map(FileAdapter.transformToDto)); 
        return {
            id: +entity.id,
            web3_address: entity.web3Address,
            email: entity.email,
            birth_date: entity.birthDate.toString(),
            confirmation_documents: entity.hasDoctorCapabilities
                ? entity.confirmationDocuments?.map(FileAdapter.transformToDto) ?? []
                : undefined,
            full_name: entity.fullName,
            has_administrator_capabilities: entity.hasAdministratorCapabilities,
            has_doctor_capabilities: entity.hasDoctorCapabilities,
            has_moderator_capabilities: entity.hasModeratorCapabilities,
            has_organization_capabilities: entity.hasOrganizationCapabilities,
            has_verified_email: entity.hasVerifiedEmail,
            is_banned: entity.isBanned,
            is_verified_doctor: entity.isVerifiedDoctor,
            organization_details: entity.organizationDetails ?? undefined,
            public_profile: entity.publicProfile ?? undefined,
            medical_organization_name: entity.hasDoctorCapabilities
                ? entity.medicalOrganizationName ?? undefined
                : undefined,
        };
    }
    transformToPublicDto(entity: UserFullEntity): PublicUserDto {
        return {
            web3_address: entity.web3Address,
            public_profile: entity.publicProfile ?? undefined,
        };
    }

    transformCreateDtoToEntity(entity: CreateUserDto): CreateUserEntity {
        return {
            email: entity.email,
            birthDate: LocalDate.parse(entity.birth_date),
            confirmationDocuments: entity.confirmation_document_ids.map(id => ({ id })),
            fullName: entity.full_name,
            hasDoctorCapabilities: entity.has_doctor_capabilities,
            medicalOrganizationName: entity.medical_organization_name,
        };
    }

    transformUpdateDtoToEntity(entity: UpdateUserDto): DeepPartial<UserFullEntity> {
        return {
            email: entity.email,
            birthDate: entity.birth_date
                ? LocalDate.parse(entity.birth_date)
                : undefined,
            confirmationDocuments: entity.confirmation_documents,
            fullName: entity.full_name,
            hasAdministratorCapabilities: entity.has_administrator_capabilities,
            hasDoctorCapabilities: entity.has_doctor_capabilities,
            hasModeratorCapabilities: entity.has_moderator_capabilities,
            hasVerifiedEmail: entity.has_verified_email,
            isBanned: entity.is_banned,
            isVerifiedDoctor: entity.is_verified_doctor,
            medicalOrganizationName: entity.medical_organization_name,
            password: entity.password, // TODO: hash
            web3Address: entity.web3_address,
        };
    }
});
