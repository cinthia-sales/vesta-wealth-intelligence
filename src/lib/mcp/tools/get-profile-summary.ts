import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getUser } from "@/data/vesta-users";

export default defineTool({
  name: "get_profile_summary",
  title: "Get Vesta profile summary",
  description:
    "Return the full snapshot for a Vesta profile: totals, RF/RV split, KPIs, alerts, upcoming maturities, and holdings summary.",
  inputSchema: {
    profile: z
      .enum(["paulo", "cinthia", "familiar"])
      .describe("Which Vesta profile to load."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ profile }) => {
    const u = getUser(profile);
    return {
      content: [{ type: "text", text: JSON.stringify(u, null, 2) }],
      structuredContent: { profile, data: u },
    };
  },
});
