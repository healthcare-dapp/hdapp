import { Module } from "@nestjs/common";
import { Web3AccountManagerService } from "./account-manager.service";

@Module({
    exports: [Web3AccountManagerService],
    providers: [Web3AccountManagerService],
})
export class Web3Module {}
