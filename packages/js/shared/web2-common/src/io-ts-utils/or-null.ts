import { nullType, Type, union } from "io-ts";

export const orNull = <A, O = A>(t: Type<A, O>) => {
    return union([t, nullType]);
};
