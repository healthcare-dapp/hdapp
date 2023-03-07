import { Type, success, failure } from "io-ts";
import isEmail from "validator/lib/isEmail";

export type EmailAddress = string & { type: "email_address" };

export const emailAddressType = new Type(
    "email",
    (v): v is EmailAddress => typeof v === "string" && isEmail(v),
    (v, ctx) => typeof v === "string" && isEmail(v) ? success(String(v) as EmailAddress) : failure(v, ctx),
    v => String(v),
);
