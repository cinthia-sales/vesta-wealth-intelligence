export const ACCESS_DEFAULT_PASSWORD = "VESTADECIDETUDO";
export const ACCESS_AUTH_KEY = "vesta_simple_auth_email";
export const ACCESS_PASSWORDS_KEY = "vesta_access_passwords";

export type AccessProfile = "paulo" | "daniel" | "cornelia" | "marcus" | "cristina";

export type AccessAccount = {
  profile: AccessProfile;
  email: string;
  username?: string;
  name: string;
  domus: string;
  note: string;
  pendingEmail?: boolean;
};

export const ACCESS_ACCOUNTS: AccessAccount[] = [
  {
    profile: "paulo",
    email: "phfurtadovr@yahoo.com.br",
    name: "Paulo",
    domus: "Domus Malta-Furtado",
    note: "acesso simples",
  },
  {
    profile: "daniel",
    email: "dmalta256@gmail.com",
    name: "Daniel Malta Furtado",
    domus: "Domus Malta-Furtado",
    note: "acesso simples",
  },
  {
    profile: "cristina",
    email: "cristina@pendente.vesta",
    username: "cristina",
    name: "Cristina",
    domus: "Domus Furtado",
    note: "vesta local · email pendente",
    pendingEmail: true,
  },
  {
    profile: "cornelia",
    email: "cornelia@domus-exemplum.vesta",
    name: "Cornelia",
    domus: "Domus Exemplum",
    note: "demonstração",
  },
  {
    profile: "marcus",
    email: "marcus@domus-exemplum.vesta",
    name: "Marcus",
    domus: "Domus Exemplum",
    note: "demonstração",
  },
];

export function normalizeAccessEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getAccessAccount(email: string): AccessAccount | null {
  const normalized = normalizeAccessEmail(email);
  return ACCESS_ACCOUNTS.find((account) => account.email === normalized || account.username === normalized) ?? null;
}

export function isAccessEmail(email: string | null | undefined): boolean {
  return !!email && !!getAccessAccount(email);
}

function readStoredPasswords(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(ACCESS_PASSWORDS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function getAccessPassword(email: string): string {
  const normalized = normalizeAccessEmail(email);
  return readStoredPasswords()[normalized] ?? ACCESS_DEFAULT_PASSWORD;
}

export function setAccessPassword(email: string, password: string): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeAccessEmail(email);
  const next = { ...readStoredPasswords(), [normalized]: password };
  window.localStorage.setItem(ACCESS_PASSWORDS_KEY, JSON.stringify(next));
}

export function resetAccessPassword(email: string): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeAccessEmail(email);
  const next = { ...readStoredPasswords() };
  delete next[normalized];
  window.localStorage.setItem(ACCESS_PASSWORDS_KEY, JSON.stringify(next));
}

export function validateAccessPassword(email: string, password: string): boolean {
  return password === getAccessPassword(email);
}
