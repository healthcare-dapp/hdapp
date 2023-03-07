import { UserEntity } from "@hdapp/shared/db-common/entities";
import { SetMetadata } from "@nestjs/common";

export const UserMatcher = (...matchers: Partial<UserEntity>[]) => SetMetadata("matchers", matchers);
