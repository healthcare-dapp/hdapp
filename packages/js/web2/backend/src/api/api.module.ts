import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { FileModule } from "./file/file.module";
import { StatisticsModule } from "./statistics/statistics.module";
import { UsersModule } from "./users/users.module";

@Module({ imports: [UsersModule, FileModule, AuthModule, StatisticsModule] })
export class ApiModule {}
