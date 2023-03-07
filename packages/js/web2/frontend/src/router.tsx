import { createHashRouter } from "react-router-dom";
import { AdminPage } from "./pages/admin";
import { DashboardPage } from "./pages/dashboard";
import { HomePage } from "./pages/home";
import { LoginPage } from "./pages/login";
import { RegistrationPage } from "./pages/registration";
import { RequestsPage } from "./pages/requests";
import { UsersPage } from "./pages/users";

export const router = createHashRouter([
    {
        path: "/",
        element: <HomePage />
    },
    {
        path: "/register",
        element: <RegistrationPage />
    },
    {
        path: "/admin",
        element: <DashboardPage />
    },
    {
        path: "/admin/login",
        element: <LoginPage />
    },
    {
        path: "/admin/users",
        element: <UsersPage />
    },
    {
        path: "/admin/requests",
        element: <RequestsPage />
    },
    {
        path: "/admin/administration",
        element: <AdminPage />
    },
]);
