export namespace endpoints {
    export const auth = {
        login: "/api/auth/login",
        register: "/api/auth/register",
        revoke_jwt: "/api/auth/revoke",
        refresh_jwt: "/api/auth/refresh",
        verify_email: "/api/auth/verify/:verifyToken"
    };

    export const file = {
        download: "/api/media/download/:id/:name",
        upload: "/api/media/upload"
    };

    export const users = {
        find_paged: "/api/users",
        find_by_id: "/api/users/by_id/:id",
        patch_by_id: "/api/users/by_id/:id",
        find_by_web3_address: "/api/users/by_web3_address/:address",
        get_current: "/api/users/current",
        patch_current: "/api/users/current",
        verify_by_id: "/api/users/by_id/:id/verify"
    };

    export const statistics = {
        get: "/api/statistics"
    };
}
