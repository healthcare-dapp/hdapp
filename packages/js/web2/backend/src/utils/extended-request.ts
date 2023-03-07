import { UserEntity } from "@hdapp/shared/db-common/entities";
import { Request } from "express";

export type ExtendedRequest = Request & {
    user: UserEntity
};
