import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MailerModule } from "@nestjs-modules/mailer";
import { ApiModule } from "./api/api.module";
import { Web3Module } from "./web3/web3.module";

const {
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    POSTGRES_DB,
    SMTP_URL,
} = process.env;

const urlParsed = new URL(SMTP_URL!);
const fromEmail = decodeURIComponent(urlParsed.username);

@Module({
    imports: [
        ApiModule,
        TypeOrmModule.forRoot({
            type: "postgres",
            host: POSTGRES_HOST,
            port: +(POSTGRES_PORT ?? 5432),
            username: POSTGRES_USER,
            password: POSTGRES_PASSWORD,
            database: POSTGRES_DB,
            autoLoadEntities: true,
            synchronize: true,
            // dropSchema: true,
        }),
        MailerModule.forRoot({
            transport: SMTP_URL,
            defaults: { from: `"Healthcare DApp" <${fromEmail}>` },
        }),
        Web3Module,
    ],
})
export class AppModule {}
