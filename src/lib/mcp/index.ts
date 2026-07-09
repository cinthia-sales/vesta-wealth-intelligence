import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProfilesTool from "./tools/list-profiles";
import getProfileSummaryTool from "./tools/get-profile-summary";
import listAlertsTool from "./tools/list-alerts";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "vesta-mcp",
  title: "Vesta — Centro de Decisão Financeira",
  version: "0.1.0",
  instructions:
    "Read-only tools for the Vesta family portfolio app. Use `list_profiles` to discover the available profiles (paulo, cinthia, familiar), `get_profile_summary` for the full snapshot of a profile, and `list_alerts` for active portfolio alerts by severity.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProfilesTool, getProfileSummaryTool, listAlertsTool],
});
