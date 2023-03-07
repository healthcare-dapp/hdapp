export const ErrorClass = (message?: string) => {
    return class GeneratedError extends Error {
        constructor(public cause?: unknown, errorMessage?: string) {
            super(errorMessage ?? message);
        }
    };
};
