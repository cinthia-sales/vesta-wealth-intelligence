// Config para deploy no Vercel — sem mcpPlugin (só funciona no Lovable).
// O nitro preset "vercel" gera output em .vercel/output/ que o Vercel lê automaticamente.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [],
  },
  nitro: {
    preset: "vercel",
  },
});
