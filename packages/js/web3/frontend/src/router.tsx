import { createHashRouter } from "react-router-dom";
import { AppointmentsPage } from "./pages/appointments";
import { DashboardPage } from "./pages/dashboard";
import { LogsPage } from "./pages/logs";
import { MessagesPage } from "./pages/messages";
import { RecordPage } from "./pages/record";

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
]);
