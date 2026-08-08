/**
 * Same-origin by default so Vercel serves UI + API together.
 * Only set NEXT_PUBLIC_API_URL for a separate FastAPI host.
 */
function resolveApiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw || raw === "undefined" || raw === "null") return "";
  // Never call localhost from a deployed browser session
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1" && raw.includes("localhost")) {
      return "";
    }
  }
  return raw.replace(/\/$/, "");
}

const API_URL = resolveApiBase();

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lsi_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("lsi_token", token);
  else localStorage.removeItem("lsi_token");
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers, cache: "no-store" });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || body.error || JSON.stringify(body);
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : "Request failed");
  }
  return res.json() as Promise<T>;
}

export { API_URL };
