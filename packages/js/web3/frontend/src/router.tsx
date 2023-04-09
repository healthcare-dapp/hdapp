import { createHashRouter } from "react-router-dom";
import { AppointmentsPage } from "./pages/appointments";
import { DashboardPage } from "./pages/dashboard";
import { LogsPage } from "./pages/logs";
import { MessagesPage } from "./pages/messages";
import { NotificationsPage } from "./pages/notifications/notifications.page";
import { RecordPage } from "./pages/record";
import { AccountSettingsPage } from "./pages/settings/account-settings.page";
import { DevicesSettingsPage } from "./pages/settings/devices-settings.page";
import { NotificationsSettingsPage } from "./pages/settings/notifications-settings.page";
import { PrivacySettingsPage } from "./pages/settings/privacy-settings.page";
import { SettingsPage } from "./pages/settings/settings.page";
import { StorageSettingsPage } from "./pages/settings/storage-settings.page";

export const router = createHashRouter([
    {
        path: "/",
        element: <DashboardPage />,
    },
    {
        path: "/records/:recordId",
        element: <RecordPage />,
    },
    {
        path: "/appointments",
        element: <AppointmentsPage />,
    },
    {
        path: "/messages",
        element: <MessagesPage />,
    },
    {
        path: "/messages/:chatId",
        element: <MessagesPage />
    },
    {
        path: "/logs",
        element: <LogsPage />,
    },
    {
        path: "/notifications",
        element: <NotificationsPage />,
    },
    {
        path: "/settings",
        element: <SettingsPage />,
    },
    {
        path: "/settings/account",
        element: <AccountSettingsPage />,
    },
    {
        path: "/settings/devices",
        element: <DevicesSettingsPage />,
    },
    {
        path: "/settings/privacy",
        element: <PrivacySettingsPage />,
    },
    {
        path: "/settings/storage",
        element: <StorageSettingsPage />,
    },
    {
        path: "/settings/notifications",
        element: <NotificationsSettingsPage />,
    },
]);
