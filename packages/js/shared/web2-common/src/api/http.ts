import axios from "axios";

let baseUrl: string | undefined;
let jwtToken: string | undefined;

export const http = axios.create();

http.interceptors.request.use(config => {
    config.url = new URL(config.url ?? "/", baseUrl ?? location.href).toString();
    if (jwtToken)
        config.headers.Authorization = `Bearer ${jwtToken}`;

    return config;
}, void 0, { synchronous: true });

export function setJwtToken(token: string) {
    jwtToken = token;
}

export function setBaseUrl(url: string) {
    baseUrl = url;
}
