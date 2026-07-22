// Cliente único da brapi (cotações B3). O plano grátis exige token:
// crie em https://brapi.dev/dashboard e coloque no .env como VITE_BRAPI_TOKEN.
const TOKEN = import.meta.env.VITE_BRAPI_TOKEN as string | undefined;

export function brapiUrl(path: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `https://brapi.dev/api/${path}${TOKEN ? `${sep}token=${TOKEN}` : ""}`;
}

export const brapiTemToken = Boolean(TOKEN);
