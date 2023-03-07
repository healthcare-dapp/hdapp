export class FriendlyError extends Error {}
export const FriendlyErrorClass = (message?: string) => {
    return class GeneratedFriendlyError extends FriendlyError {
        constructor(public cause?: unknown, errorMessage?: string) {
            super(errorMessage ?? message);
        }
    };
};
