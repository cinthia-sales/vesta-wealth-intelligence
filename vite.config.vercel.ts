// Config para deploy no Vercel.
// O plugin nitro com preset "vercel" gera .vercel/output/ (static + serverless
// function) que o Vercel lê automaticamente. Sem ele o build só produz dist/
// e o deploy sobe vazio (404 em tudo).
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    nitro({ preset: "vercel" }),
    react(),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
