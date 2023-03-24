import { setBaseUrl } from "@hdapp/shared/web2-common/api/http";
import React from "react";
import { createRoot } from "react-dom/client";
import { App2 } from "./App2";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/400-italic.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

// @ts-ignore
setBaseUrl(import.meta.env.VITE_API_BASE_URL);

const root = createRoot(
    document.getElementById("root")!
);

root.render(
    <React.StrictMode>
        <App2 />
    </React.StrictMode>
);
