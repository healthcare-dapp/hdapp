import { bgRed, bgYellow, gray, grey, yellow } from "colors";

export class Logger {
    private readonly _context: string;

    constructor(...contexts: string[]) {
        this._context = contexts.map(context => `[${context}]`).join(" ");
    }

    log = (...values: any[]) => {
        console.log(new Date().toISOString(), yellow(this._context), ...values);
    };

    warn = (...values: any[]) => {
        console.warn(new Date().toISOString(), yellow(this._context), bgYellow("[warn]"), ...values);
    };

    error = (...values: any[]) => {
        console.error(new Date().toISOString(), yellow(this._context), bgRed("[error]"), ...values);
    };

    debug = (...values: any[]) => {
        console.debug(new Date().toISOString(), yellow(this._context), gray("[debug]"), ...values);
    };

    trace = (...values: any[]) => {
        console.trace(new Date().toISOString(), yellow(this._context), "[trace]", ...values);
    };
}
