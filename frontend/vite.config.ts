import path from "path"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa"

import pkg from "./package.json";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, path.resolve(__dirname, "."), "")

    return {
        base: "./",
        plugins: [
            react(), 
            tailwindcss(),
            VitePWA({
                srcDir: "src",
                filename: "sw.js",
                injectRegister: "auto",
                strategies: "injectManifest",
                registerType: "autoUpdate",
                injectManifest: {
                    globPatterns: [
                        "**/*.{js,css,html,png,svg,jpg,jpeg,gif,webp,woff,woff2,ttf,eot}",
                    ],
                    injectionPoint: "self.__WB_MANIFEST",
                    additionalManifestEntries: [
                        { url: "/", revision: pkg.version }
                    ]
                },
                manifest: {
                    name: "Website Visitor Geolocator",
                    short_name: "WVG",
                    description: "Track and analyze website visitor geolocation data",
                    theme_color: "#0f172a",
                    background_color: "#ffffff",
                    display: "standalone",
                    display_override: ["standalone", "fullscreen"],
                    start_url: "./",
                    scope: "./",
                    icons: [
                        {
                            src: "./logo.svg",
                            sizes: "any",
                            type: "image/svg+xml",
                            purpose: "any",
                        },
                        {
                            src: "./logo-bg-192.png",
                            sizes: "192x192",
                            type: "image/png",
                            purpose: "any",
                        },
                        {
                            src: "./logo-bg-512.png",
                            sizes: "512x512",
                            type: "image/png",
                            purpose: "maskable",
                        },
                    ],
                    categories: ["productivity", "utilities"],
                    lang: "en",
                    orientation: "portrait-primary",
                },
                devOptions: {
                    enabled: true,
                    type: "module",
                },
            })
        ],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        define: {
            __APP_ENV__: JSON.stringify(env.APP_ENV || mode),
        },
        build: {
            outDir: "./dist",
            emptyOutDir: true,
            target: "es2015",
            minify: "terser",
            sourcemap: false,
            rollupOptions: {
                output: {
                    chunkFileNames: "assets/js/[name]-[hash].js",
                    entryFileNames: "assets/js/[name]-[hash].js",
                    assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
                },
            },
        },
    }
})
