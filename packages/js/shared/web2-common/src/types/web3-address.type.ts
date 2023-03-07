import { Type, success, failure } from "io-ts";
import isEthereumAddress from "validator/lib/isEthereumAddress";

export type Web3Address = string & { type: "web3Address" };

export const web3AddressType = new Type(
    "web3Address",
    (v): v is Web3Address => typeof v === "string" && isEthereumAddress(v),
    (v, ctx) => typeof v === "string" && isEthereumAddress(v) ? success(String(v) as Web3Address) : failure(v, ctx),
    v => String(v),
);
