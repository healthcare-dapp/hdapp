import { Request } from "express";
import { UserFullEntity } from "../entities/user-full.entity";

export type ExtendedRequest = Request & {
    user: UserFullEntity
};
