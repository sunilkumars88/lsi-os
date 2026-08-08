import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { DEMO_ADMIN_ID, DEMO_ANALYST_ID, DEMO_ORG_ID } from "./ids";
import { ensureSeeded, type User } from "./store";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || "lsi-os-vercel-demo-secret-change-me");

export async function signToken(user: User) {
  return new SignJWT({
    role: user.role,
    org_id: user.org_id,
    email: user.email,
    full_name: user.full_name,
    org_name: "LSI Demo Pharma",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret());
  return payload;
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compareSync(plain, hash);
}

export function hashPassword(plain: string) {
  return bcrypt.hashSync(plain, 10);
}

/** Reconstruct user from JWT so auth works across serverless instances. */
export async function userFromAuthHeader(authHeader: string | null): Promise<User | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const payload = await verifyToken(authHeader.slice(7));
    const id = String(payload.sub || "");
    if (!id) return null;

    // Prefer live store user when present (same warm instance)
    const s = ensureSeeded();
    const existing = s.users.find((u) => u.id === id && u.is_active);
    if (existing) return existing;

    // Fallback: claims-only user (cross-instance)
    const email = String(payload.email || "");
    const role = String(payload.role || "analyst");
    const org_id = String(payload.org_id || DEMO_ORG_ID);
    const full_name = String(payload.full_name || email || "User");
    if (!email && id !== DEMO_ADMIN_ID && id !== DEMO_ANALYST_ID) return null;

    return {
      id,
      org_id,
      email: email || (id === DEMO_ADMIN_ID ? "admin@lsi.os" : "analyst@lsi.os"),
      full_name,
      hashed_password: "",
      role,
      is_active: true,
      created_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
