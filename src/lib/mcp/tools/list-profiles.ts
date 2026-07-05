import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getUser } from "@/data/vesta-users";

const PROFILE_IDS = ["paulo", "cinthia", "familiar"] as const;

export default defineTool({
  name: "list_profiles",
  title: "List Vesta profiles",
  description:
    "List the available Vesta portfolio profiles (Paulo, Cinthia, and the consolidated Familiar view) with headline totals.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const rows = PROFILE_IDS.map((id) => {
      const u = getUser(id);
      return {
        id,
        nome: u.nome,
        conta: u.conta,
        total: u.total,
        rf_pct: u.rf_pct,
        rv_pct: u.rv_pct,
      };
    });
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { profiles: rows },
    };
  },
});
