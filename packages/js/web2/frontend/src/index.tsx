import { setBaseUrl } from "@hdapp/shared/web2-common/api/http";
import React from "react";
import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";
import { App } from "./App";
import "react-toastify/dist/ReactToastify.css";
// @ts-ignore
setBaseUrl(import.meta.env.VITE_API_BASE_URL);
console.log(import.meta.env.VITE_API_BASE_URL);

const root = createRoot(
    document.getElementById("root")!
);

root.render(
    <React.StrictMode>
        <App />
        <ToastContainer position="bottom-right" newestOnTop />
    </React.StrictMode>
);
