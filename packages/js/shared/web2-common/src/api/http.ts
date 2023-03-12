/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosResponse } from "axios";
import { getRightOrFail } from "../io-ts-utils";
import { ApiResponse } from "../types/api-response.type";
import { Logger } from "../utils";
import { HttpInstance } from "./http.types";

let baseUrl: string | undefined;
let jwtToken: string | undefined;

export const http = axios.create() as HttpInstance;
const { debug, error } = new Logger("axios");

http.interceptors.request.use(config => {
    config.url = new URL(config.url ?? "/", baseUrl ?? location.href).toString();
    if (jwtToken)
        config.headers.Authorization = `Bearer ${jwtToken}`;

    debug(config.method?.toUpperCase(), config.url, config);
    return config;
}, err => {
    error("Request config failed.", err);
}, { synchronous: true });

http.interceptors.response.use(response => {
    const type = response.config.type;
    if (!type)
        return response;

    const decoded = getRightOrFail(
        ApiResponse(type).decode(response.data)
    );

    return decoded.data;
}, err => {
    error("Request failed.", err);
}, { synchronous: true });

export function setJwtToken(token: string) {
    jwtToken = token;
}

export function setBaseUrl(url: string) {
    debug("Base URL set to", url);
    baseUrl = url;
}
