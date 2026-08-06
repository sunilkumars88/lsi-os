import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { ensureSeeded, type User } from "./store";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || "lsi-os-vercel-demo-secret-change-me");

export async function signToken(user: User) {
  return new SignJWT({ role: user.role, org_id: user.org_id, email: user.email })
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

export async function userFromAuthHeader(authHeader: string | null): Promise<User | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const payload = await verifyToken(authHeader.slice(7));
    const s = ensureSeeded();
    const user = s.users.find((u) => u.id === payload.sub && u.is_active);
    return user || null;
  } catch {
    return null;
  }
}
