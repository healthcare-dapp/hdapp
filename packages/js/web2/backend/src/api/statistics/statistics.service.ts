import { UserEntity } from "@hdapp/shared/db-common/entities";
import { StatisticsDto } from "@hdapp/shared/web2-common/dto/statistics.dto";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

@Injectable()
export class StatisticsService {
    constructor(
        @InjectRepository(UserEntity)
        private users: Repository<UserEntity>,
    ) {}

    async getStatistics(): Promise<StatisticsDto> {
        return {
            users: {
                total: await this.users.count({ where: { isBanned: false } }),
                active: 0,
                new: 0,
                totalDoctors: await this.users.count({ where: { isBanned: false, isVerifiedDoctor: true } }),
                pending: await this.users.count({ where: { isBanned: false, web3Address: IsNull() } }),
            },
        };
    }
}
