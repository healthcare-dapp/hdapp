export namespace endpoints {
    export const auth = {
        login: "/api/auth/login",
        register: "/api/auth/register",
        revoke_jwt: "/api/auth/revoke",
        refresh_jwt: "/api/auth/refresh",
        verify_email: "/api/auth/verify/:verifyToken"
    } as const;

    export const file = {
        download: "/api/media/download/:id/:name",
        upload: "/api/media/upload"
    } as const;

    export const reports = {
        send: "/api/reports",
        find_paged: "/api/reports",
        patch_by_id: "/api/reports/by_id/:id",
    } as const;

    export const users = {
        create_one: "/api/users",
        find_paged: "/api/users",
        find_public_profiles_paged: "/api/users/public",
        get_filters: "/api/users/public/filters",
        find_by_id: "/api/users/by_id/:id",
        patch_by_id: "/api/users/by_id/:id",
        find_by_web3_address: "/api/users/by_web3_address/:address",
        find_public_profile_by_web3_address: "/api/users/by_web3_address/:address/public_profile",
        get_current: "/api/users/current",
        patch_current: "/api/users/current",
        patch_public_profile_current: "/api/users/web3/public_profile",
        verify_by_id: "/api/users/by_id/:id/verify"
    } as const;

    export const statistics = {
        get: "/api/statistics"
    } as const;
}
