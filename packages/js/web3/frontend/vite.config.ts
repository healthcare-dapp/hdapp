import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    cacheDir: "../../../../node_modules/.vite/pwa-frontend",
    base: "./",

    server: {
        port: 4200,
        host: "localhost",
    },

    preview: {
        port: 4300,
        host: "localhost",
    },

    plugins: [
        react(),
        viteTsConfigPaths({
            root: "../../../../",
        }),
    ],
});
