import { Logger } from "./logger";

const { error } = new Logger();

export const ErrorClass = (message?: string) => {
    return class GeneratedError extends Error {
        constructor(public cause?: unknown, errorMessage?: string) {
            super(errorMessage ?? message);
            error(errorMessage ?? message, cause);
        }
    };
};
