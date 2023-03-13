import { UserEntity } from "@hdapp/shared/db-common/entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "../users/users.module";
import { StatisticsController } from "./statistics.controller";

@Module({
    imports: [
        UsersModule,
        TypeOrmModule.forFeature([UserEntity]),
    ],
    controllers: [StatisticsController],
})
export class StatisticsModule {}
