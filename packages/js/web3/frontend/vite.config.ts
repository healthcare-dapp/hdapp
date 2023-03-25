import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    cacheDir: "../../../../node_modules/.vite/pwa-frontend",
    base: "./",

    server: {
        port: 4200,
        host: "0.0.0.0",
        fs: { strict: false }
    },

    preview: {
        port: 4300,
        host: "0.0.0.0",
    },

    plugins: [
        react(),
        viteTsConfigPaths({
            root: "../../../../",
        }),
    ],
});
