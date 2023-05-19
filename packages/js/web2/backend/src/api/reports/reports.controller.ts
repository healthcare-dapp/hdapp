import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Web3AccountManagerService } from "../../web3/account-manager.service";
import { UsersService } from "../users/users.service";

@ApiTags("Reports management")
@Controller()
export class ReportsController {
    constructor(
        private users: UsersService,
        private web3: Web3AccountManagerService,
    ) {}

}
