import { CreateUserEntity, UserEntity } from "@hdapp/shared/db-common/entities";
import { UserFiltersDto } from "@hdapp/shared/web2-common/dto";
import { StatisticsDto } from "@hdapp/shared/web2-common/dto/statistics.dto";
import { getRightOrFail } from "@hdapp/shared/web2-common/io-ts-utils";
import { EmailAddress, Web3Address, web3AddressType } from "@hdapp/shared/web2-common/types";
import { FriendlyErrorClass, Logger } from "@hdapp/shared/web2-common/utils";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { HDNodeWallet, Wallet } from "ethers";
import { Repository, DeepPartial, EntityNotFoundError, QueryFailedError, Brackets } from "typeorm";
import { PagedResponse } from "../../../../../shared/web2-common/src/types/paged-response.type";
import { UserFullEntity } from "../../entities/user-full.entity";
import { Web3AccountManagerService } from "../../web3/account-manager.service";
import { MailService } from "../auth/mail.service";

export class UserNotFoundError extends FriendlyErrorClass("User does not exist") {}
export class UserUpdateDetailsNotUniqueError extends FriendlyErrorClass() {}

const { error, debug } = new Logger("users-service");

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserEntity)
        private users: Repository<UserEntity>,
        private mail: MailService,
        private web3: Web3AccountManagerService,
    ) { }

    async createWalletForUser(user: UserEntity): Promise<HDNodeWallet> {
        const wallet = Wallet.createRandom();
        const web3Address = getRightOrFail(web3AddressType.decode(wallet.address));

        try {
            await this.users.update(
                { id: user.id },
                { web3Address },
            );
        } catch (e) {
            if (e instanceof EntityNotFoundError) {
                throw new UserNotFoundError(e);
            }

            throw e;
        }

        void this.web3.giveFreeMoney(web3Address);

        await this.mail.sendWalletInfo(
            user.email,
            web3Address,
            wallet.privateKey.replace("0x", ""),
            wallet.mnemonic!.phrase,
        );

        return wallet;
    }

    async findOneById(id: string): Promise<UserFullEntity> {
        try {
            const dbEntity = await this.users.findOneOrFail({
                relations: ["confirmationDocuments"],
                where: { id }
            });
            const web3Entity = await this.web3.getAccountInfo(dbEntity.web3Address);
            return {
                ...dbEntity,
                ...web3Entity
            };
        } catch (e) {
            if (e instanceof EntityNotFoundError) {
                throw new UserNotFoundError(e);
            }

            throw e;
        }
    }

    async findOneByWeb3Address(web3Address: Web3Address): Promise<UserFullEntity> {
        try {
            const [dbEntity, web3Entity] = await Promise.all(
                [
                    this.users.findOneOrFail({
                        relations: ["confirmationDocuments"],
                        where: { web3Address }
                    }),
                    this.web3.getAccountInfo(web3Address)
                ]
            ) ;
            return {
                ...dbEntity,
                ...web3Entity
            };
        } catch (e) {
            if (e instanceof EntityNotFoundError) {
                throw new UserNotFoundError(e);
            }

            throw e;
        }
    }

    async findOneByEmail(
        email: EmailAddress,
    ): Promise<UserEntity> {
        try {
            return await this.users.findOneOrFail({ relations: ["confirmationDocuments"], where: { email } });
        } catch (e) {
            if (e instanceof EntityNotFoundError) {
                throw new UserNotFoundError(e);
            }

            throw e;
        }
    }

    async createOne(user: CreateUserEntity): Promise<UserEntity> {
        try {
            await this.users.insert(user);
        } catch (e) {
            if (e instanceof QueryFailedError) {
                error(e);
                throw new UserUpdateDetailsNotUniqueError(e, "Provided details are not unique");
            }

            throw e;
        }

        return await this.findOneByEmail(user.email);
    }

    save(user: Partial<UserEntity>) {
        return this.users.save(user);
    }

    updateOne(uid: string | number, user: DeepPartial<UserEntity>) {
        try {
            return this.users.update(uid.toString(), user);
        } catch (e) {
            if (e instanceof EntityNotFoundError) {
                throw new UserNotFoundError(e);
            }

            throw e;
        }
    }

    deleteOne(uid: string | number) {
        return this.users.delete(uid.toString());
    }

    async findPaged(
        fromId: string,
        filters: UserFiltersDto,
        sortBy: keyof UserEntity,
        shouldSortInDescendingOrder: boolean,
    ): Promise<PagedResponse<UserFullEntity>> {
        let builder = this.users.createQueryBuilder("user");

        builder = builder.where("user.id > :from_id", { from_id: fromId });

        const query = filters.query?.toLowerCase().trim() ?? "";
        builder = builder.where(
            new Brackets(qb => {
                qb.where("LOWER(user.fullName) LIKE :query", { query: `%${query}%` })
                    .orWhere("LOWER(user.medicalOrganizationName) LIKE :query", { query: `%${query}%` });
            }),
        );

        if (filters.has_doctor_capabilities !== undefined)
            builder = builder.andWhere(
                "user.hasDoctorCapabilities = :has_doctor_capabilities",
                { has_doctor_capabilities: filters.has_doctor_capabilities },
            );

        if (filters.is_verified_doctor !== undefined)
            builder = builder.andWhere(
                "user.isVerifiedDoctor = :is_verified_doctor",
                { is_verified_doctor: filters.is_verified_doctor },
            );

        if (filters.has_web3_address !== undefined)
            builder = builder.andWhere(filters.has_web3_address
                ? "user.web3Address IS NOT NULL"
                : "user.web3Address IS NULL");

        if (filters.medical_organization_name !== undefined)
            builder = builder.andWhere(
                "user.medicalOrganizationName = :medical_organization_name",
                { medical_organization_name: filters.medical_organization_name },
            );

        builder = builder.limit(50);
        builder.orderBy(sortBy, shouldSortInDescendingOrder ? "DESC" : "ASC");

        debug(builder.expressionMap);

        try {
            const dbEntities = await builder.getMany();
            const merged = await Promise.all(
                dbEntities.map(async u => {
                    const web3Entity = await this.web3.getAccountInfo(u.web3Address);
                    return {
                        ...u,
                        ...web3Entity
                    };
                })
            );
            const filtered = merged.filter(u => {
                if (filters.is_banned !== undefined && u.isBanned !== filters.is_banned)
                    return false;
                if (filters.is_verified_doctor !== undefined && u.isVerifiedDoctor !== filters.is_verified_doctor)
                    return false;
                return true;
            });

            return {
                items: filtered,
                // TODO
                next_page_id: "0",
                previous_page_id: "0",
                total_count: 0,
            };
        } catch (e) {
            if (e instanceof EntityNotFoundError) {
                throw new UserNotFoundError(e);
            }

            throw e;
        }
    }

    async verifyDoctorAccount(id: string): Promise<UserFullEntity> {
        const user = await this.findOneById(id);
        const wallet = await this.createWalletForUser(user);
        const web3Address = getRightOrFail(
            web3AddressType.decode(wallet.address),
        );
        await this.web3.promoteToDoctor(web3Address);
        await this.mail.sendReviewCompleteEmail(user.email);
        return await this.findOneById(id);
    }

    async getStatistics(): Promise<StatisticsDto> {
        const allUsers = await this.users.find();
        const withAddress = allUsers.filter(u => u.web3Address);
        const allWeb3Users = await Promise.all(
            withAddress.map(u => this.web3.getAccountInfo(u.web3Address!))
        );
        const allNotBannedUsers = allWeb3Users
            .filter(u => !u.isBanned);
        const allVerifiedDoctors = allNotBannedUsers
            .filter(u => u.isVerifiedDoctor);

        return {
            users: {
                total: allNotBannedUsers.length,
                active: 0,
                new: 0,
                totalDoctors: allVerifiedDoctors.length,
                pending: allUsers.length - withAddress.length,
            },
        };
    }
}
