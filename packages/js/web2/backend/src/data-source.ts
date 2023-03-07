import { DataSource } from "typeorm";

const {
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    POSTGRES_DB,
} = process.env;

// eslint-disable-next-line import/no-default-export
export default new DataSource({
    type: "postgres",
    host: POSTGRES_HOST,
    port: +(POSTGRES_PORT ?? 5432),
    username: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    database: POSTGRES_DB,
    entities: ["db/entities/*.ts"],
    migrations: ["db/migrations/*.ts"],
});
