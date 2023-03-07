import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import React from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";

export const App: React.FC = () => {
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <RouterProvider router={router} />
        </LocalizationProvider>
    );
};
