const apiBase = import.meta.env.VITE_API_BASE_URL || "https://localhost:7201/api";

let accessToken: string | null = null;
let expiresAt = 0;

export class TokenForbiddenError extends Error {
  constructor() {
    super("User is not authorized for this application");
    this.name = "TokenForbiddenError";
  }
}

function clearAppTokenState(): void {
  accessToken = null;
  expiresAt = 0;
}

export async function fetchAppToken(): Promise<string | null> {
  try {
    const res = await fetch(`${apiBase}/auth/token`, { credentials: "include" });

    if (res.status === 403) {
      clearAppTokenState();
      throw new TokenForbiddenError();
    }

    if (!res.ok) {
      clearAppTokenState();
      return null;
    }

    const data = (await res.json()) as { accessToken?: string; expiresIn?: number };
    accessToken = data.accessToken ?? null;
    expiresAt = Date.now() + (data.expiresIn ?? 0) * 1000;

    if (!accessToken) {
      clearAppTokenState();
      return null;
    }

    return accessToken;
  } catch (err) {
    if (err instanceof TokenForbiddenError) throw err;
    clearAppTokenState();
    return null;
  }
}

export async function getAppAccessToken(): Promise<string | null> {
  if (accessToken && Date.now() < expiresAt - 60_000) return accessToken;
  return fetchAppToken();
}

export function redirectToLogin(): void {
  const returnUrl = encodeURIComponent(window.location.href);
  window.location.href = `${apiBase}/auth/login?returnUrl=${returnUrl}`;
}

export async function logoutSession(): Promise<void> {
  try {
    await fetch(`${apiBase}/auth/logout`, { method: "POST", credentials: "include" });
  } finally {
    clearAppTokenState();
  }
}

export function clearAppToken(): void {
  clearAppTokenState();
}
