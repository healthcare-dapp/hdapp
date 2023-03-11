import { endpoints } from "@hdapp/shared/web2-common/api";
import { CreateUserDto, LoginUserSuccessDto, TokenDto } from "@hdapp/shared/web2-common/dto";
import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Param,
    Post,
    Request,
    Response,
    UnauthorizedException,
    UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import { Response as ExpressResponse } from "express";
import { UserAdapter } from "../../db/adapters/user.adapter";
import { LocalAuthGuard } from "../../guards/local.guard";
import { ExtendedRequest } from "../../utils/extended-request";
import { IoTsValidationPipe } from "../../utils/io-ts.pipe";
import { AuthService, EmailVerificationError, JwtTokenRevokedError } from "./auth.service";

@ApiTags("User authorization and registration")
@Controller()
export class AuthController {
    constructor(
        private auth: AuthService,
    ) { }

    @UseGuards(LocalAuthGuard)
    @Post(endpoints.auth.login)
    @ApiOperation({ description: "Performs a email-password authorization of user, returning a JWT." })
    @ApiBody({ description: "Email and password." })
    login(
        @Request() { user }: ExtendedRequest,
    ): LoginUserSuccessDto {
        const [accessToken, refreshToken] = this.auth.generateJwtToken(user);

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }

    @Post(endpoints.auth.register)
    @ApiOperation({ description: "Creates a new user account." })
    @ApiBody({ description: "Registration details." })
    async register(@Body(new IoTsValidationPipe(CreateUserDto)) u: CreateUserDto) {
        await this.auth.register(
            UserAdapter.transformCreateDtoToEntity(u),
        );
    }

    @Post(endpoints.auth.refresh_jwt)
    @ApiOperation({ description: "Refreshes auth JWT." })
    async refreshToken(@Body() t: TokenDto): Promise<TokenDto> {
        try {
            const [accessToken, refreshToken] = await this.auth.refreshJwtToken(t.access_token, t.refresh_token);
            return {
                access_token: accessToken,
                refresh_token: refreshToken,
            };
        } catch (e) {
            if (e instanceof JwtTokenRevokedError)
                throw new UnauthorizedException(e.message);

            throw e;
        }
    }

    @Post(endpoints.auth.revoke_jwt)
    @ApiOperation({ description: "Invalidates auth JWT." })
    async revokeToken(@Body() t: TokenDto) {
        try {
            await this.auth.revokeJwtToken(t.refresh_token);
        } catch (e) {
            if (e instanceof JwtTokenRevokedError)
                throw new UnauthorizedException(e.message);

            throw e;
        }
    }

    @Get(endpoints.auth.verify_email)
    @ApiOperation({ description: "Verifies user account from a link in an email letter." })
    async verify(@Param("verifyToken") token: string,
        @Response() response: ExpressResponse,
    ) {
        try {
            await this.auth.verifyEmailByJwtToken(token);
            response.redirect("/app?verify=success");
        } catch (e) {
            if (e instanceof EmailVerificationError)
                throw new BadRequestException(e.message);

            throw e;
        }
    }
}
