import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getUser } from "@/data/vesta-users";

const SEVERITY_LABEL = { r: "urgente", w: "atenção", g: "positivo" } as const;

export default defineTool({
  name: "list_alerts",
  title: "List portfolio alerts",
  description:
    "List active alerts for a Vesta profile with severity (r=urgente, w=atenção, g=positivo).",
  inputSchema: {
    profile: z
      .enum(["paulo", "cinthia", "familiar"])
      .describe("Which Vesta profile to load alerts for."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ profile }) => {
    const u = getUser(profile);
    const alertas = u.alertas_list.map((a) => ({
      severidade: a.cor,
      severidade_label: SEVERITY_LABEL[a.cor],
      titulo: a.titulo,
      detalhe: a.det,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(alertas, null, 2) }],
      structuredContent: {
        profile,
        total: alertas.length,
        counts: {
          urgente: alertas.filter((a) => a.severidade === "r").length,
          atencao: alertas.filter((a) => a.severidade === "w").length,
          positivo: alertas.filter((a) => a.severidade === "g").length,
        },
        alertas,
      },
    };
  },
});
