import { Either, isLeft } from "fp-ts/lib/Either";
import { ErrorClass } from "../utils/error";

export class IoTsDecodeError extends ErrorClass("Could not decode an io-ts type") {}

export function getRightOrFail<E, A>(either: Either<E, A>) {
    if (isLeft(either))
        throw new IoTsDecodeError(either.left);

    return either.right;
}
