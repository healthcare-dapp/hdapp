import { setBaseUrl } from "@hdapp/shared/web2-common/api/http";
import React from "react";
import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";
import { App2 } from "./App2";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/400-italic.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "react-toastify/dist/ReactToastify.css";

// @ts-ignore
setBaseUrl(import.meta.env.VITE_API_BASE_URL);

const root = createRoot(
    document.getElementById("root")!
);

root.render(
    <React.StrictMode>
        <App2 />
        <ToastContainer position="bottom-right" newestOnTop />
    </React.StrictMode>
);
