import { endpoints } from "@hdapp/shared/web2-common/api/endpoints";
import { SelfUpdateUserDto, UpdateUserDto, UserDto, UserFiltersDto } from "@hdapp/shared/web2-common/dto";
import { PagedResponse, Web3Address, web3AddressType } from "@hdapp/shared/web2-common/types";
import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, Request, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserAdapter } from "../../adapters/user.adapter";
import { JwtAuthGuard } from "../../guards/jwt.guard";
import { UserMatcher } from "../../guards/user-matcher.decorator";
import { UserGuard } from "../../guards/user.guard";
import { Base64Pipe } from "../../utils/base64.pipe";
import { ExtendedRequest } from "../../utils/extended-request";
import { IoTsValidationPipe } from "../../utils/io-ts.pipe";
import { MailService } from "../auth/mail.service";
import { UserNotFoundError, UsersService } from "./users.service";

@ApiTags("User management")
@Controller()
export class UsersController {
    constructor(
        private users: UsersService,
        private mail: MailService,
    ) {}

    @UserMatcher({ hasModeratorCapabilities: true })
    @UseGuards(JwtAuthGuard, UserGuard)
    @Get(endpoints.users.find_paged)
    @ApiOperation({ description: "Retrieve all users in pages." })
    @ApiBearerAuth()
    async getUsers(@Query("from_id") from_id?: string,
        @Query("filters", new Base64Pipe(), new IoTsValidationPipe(UserFiltersDto)) filters?: UserFiltersDto,
        @Query("sort_by") sort_by?: string,
        @Query("sort_desc") sort_desc_str?: string,
    ): Promise<PagedResponse<UserDto>> {
        const shouldBeInDescendingOrder = !!sort_desc_str;

        const pagedEntities = await this.users.findPaged(
            from_id ?? "0",
            filters ?? {},
            /* sort_by ??  */"id",
            shouldBeInDescendingOrder,
        );
        return {
            next_page_id: pagedEntities.next_page_id,
            previous_page_id: pagedEntities.previous_page_id,
            total_count: pagedEntities.total_count,
            items: pagedEntities.items.map(
                UserAdapter.transformToDto,
            ),
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get(endpoints.users.get_current)
    @ApiOperation({ description: "Displays data of currently logged in user." })
    @ApiBearerAuth()
    getCurrentUser(@Request() request: ExtendedRequest): UserDto {
        return UserAdapter.transformToDto(request.user);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(endpoints.users.patch_current)
    @ApiOperation({ description: "Updates data of the currently logged in user." })
    @ApiBearerAuth()
    async updateCurrentUser(@Request() request: ExtendedRequest,
        @Body() data: SelfUpdateUserDto): Promise<UserDto> {
        try {
            await this.users.updateOne(
                request.user.id,
                UserAdapter.transformUpdateDtoToEntity(data),
            );
            return UserAdapter.transformToDto(request.user);
        } catch (e) {
            if (e instanceof UserNotFoundError)
                throw new NotFoundException(e.message);

            throw e;
        }
    }

    @Get(endpoints.users.find_by_id)
    @ApiOperation({ description: "Retrieve a user by their ID." })
    async getUserById(@Param("id") id: string): Promise<UserDto> {
        try {
            return UserAdapter.transformToDto(
                await this.users.findOneById(id),
            );
        } catch (e) {
            if (e instanceof UserNotFoundError)
                throw new NotFoundException(e.message);

            throw e;
        }
    }

    @Get(endpoints.users.find_by_web3_address)
    @ApiOperation({ description: "Retrieve a user by their ID." })
    async getUserByWeb3Address(@Param("address", new IoTsValidationPipe(web3AddressType)) address: Web3Address): Promise<UserDto> {
        try {
            return UserAdapter.transformToDto(
                await this.users.findOneByWeb3Address(address),
            );
        } catch (e) {
            if (e instanceof UserNotFoundError)
                throw new NotFoundException(e.message);

            throw e;
        }
    }

    @UserMatcher({ hasAdministratorCapabilities: true })
    @UseGuards(JwtAuthGuard, UserGuard)
    @Patch(endpoints.users.patch_by_id)
    @ApiOperation({ description: "Update information on a user by ID." })
    @ApiBearerAuth()
    async updateUserById(@Param("id") id: string,
        @Body("data", new IoTsValidationPipe(UpdateUserDto)) data: UpdateUserDto,
    ): Promise<UserDto> {
        try {
            const updateData = UserAdapter.transformUpdateDtoToEntity(data);
            await this.users.updateOne(id, updateData);

            return UserAdapter.transformToDto(
                await this.users.findOneById(id),
            );
        } catch (e) {
            if (e instanceof UserNotFoundError)
                throw new NotFoundException(e.message);

            throw e;
        }
    }

    @UserMatcher({ hasModeratorCapabilities: true })
    @UseGuards(JwtAuthGuard, UserGuard)
    @Post(endpoints.users.verify_by_id)
    @ApiOperation({ description: "Sets a verification flag for the user." })
    @ApiBearerAuth()
    async verifyDoctor(@Param("id") id: string): Promise<UserDto> {
        try {
            const entity = await this.users.verifyDoctorAccount(id);
            return UserAdapter.transformToDto(entity);
        } catch (e) {
            if (e instanceof UserNotFoundError)
                throw new NotFoundException(e.message);

            throw e;
        }
    }
}
