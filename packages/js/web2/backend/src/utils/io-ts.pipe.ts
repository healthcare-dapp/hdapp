import { Logger } from "@hdapp/shared/web2-common/utils";
import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import { either } from "fp-ts";
import { Type } from "io-ts";

const { warn } = new Logger("io-ts");
@Injectable()
export class IoTsValidationPipe<A, O = A> implements PipeTransform {

    constructor(private type: Type<A, O>) {}

    transform(value: unknown) {
        const result = this.type.decode(value);
        if (either.isLeft(result)) {
            const keys = result.left[0].context
                .map(c => c.key)
                .filter(c => !!c.trim())
                .join(", ");
            warn("Decoding failed.", JSON.stringify(result.left));
            throw new BadRequestException({
                message: "Validation failed",
                description: "Following fields failed to pass checks: " + keys,
            });
        }
        return result.right;
    }
}
