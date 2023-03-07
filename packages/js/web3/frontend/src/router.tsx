import { createHashRouter } from "react-router-dom";
import { DashboardPage } from "./pages/dashboard";
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
        path: "/messages",
        element: <MessagesPage />,
    },
    {
        path: "/messages/:chatId",
        element: <MessagesPage />
    }
]);
