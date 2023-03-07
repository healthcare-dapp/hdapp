import { Type, undefined, union } from "io-ts";

export const orUndefined = <A, O = A>(t: Type<A, O>) => {
    return union([t, undefined]);
};
