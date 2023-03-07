import { Injectable } from "@nestjs/common";
import { createClient } from "redis";

@Injectable()
export class RedisService {
    private readonly _client = createClient({ url: process.env.REDIS_URL });

    exists = this._client.exists;

    set = this._client.set;
}
