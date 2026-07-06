// Config para rodar LOCAL no Windows — não usar no Lovable.
// O mcpPlugin tem bug com backslashes do Windows, então é omitido aqui.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [],
  },
});
