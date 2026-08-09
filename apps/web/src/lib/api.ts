/**
 * Prefer NestJS platform API when NEXT_PUBLIC_API_URL is set (Docker/local :4000).
 * Same-origin (empty base) uses the Next.js BFF for Vercel demos.
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

/** True when the browser is pointed at Nest (:4000) rather than the same-origin BFF. */
export function isNestBackend(): boolean {
  return Boolean(API_URL);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lsi_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("lsi_token", token);
  else localStorage.removeItem("lsi_token");
}

function extractErrorDetail(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const o = body as Record<string, unknown>;
  const msg = o.detail ?? o.error ?? o.message;
  if (typeof msg === "string") return msg;
  if (Array.isArray(msg)) return msg.map(String).join(", ");
  if (msg && typeof msg === "object") return JSON.stringify(msg);
  return fallback;
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers || {});
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!headers.has("Content-Type") && options.body && !isForm) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers, cache: "no-store" });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = extractErrorDetail(await res.json(), detail);
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : "Request failed");
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/** Try primary path; on 404/501 fall back to alternate (Nest vs BFF). */
export async function apiWithFallback<T = unknown>(
  primary: string,
  fallback: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    return await api<T>(primary, options);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/not found|404|Cannot GET|Cannot POST|501/i.test(msg)) {
      return api<T>(fallback, options);
    }
    throw e;
  }
}

export { API_URL };
