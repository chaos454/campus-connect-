import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import netlify from "@netlify/vite-plugin-tanstack-start";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// Official TanStack Start + Netlify
// https://docs.netlify.com/build/frameworks/framework-setup-guides/tanstack-start/
export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    // Order: Start → Netlify → React → Tailwind
    tanstackStart(),
    netlify(),
    viteReact(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 1200,
  },
});
