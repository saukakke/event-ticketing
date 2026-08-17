import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-eventflow_session" : "eventflow_session";
const JWT_ALGORITHM = "HS256" as const;
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const JWT_ISSUER = "eventflow-api";
const JWT_AUDIENCE = "eventflow-web";
const secretValue = process.env.JWT_SECRET;
if (!secretValue || secretValue.length < 32) { if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET must be at least 32 characters in production."); }
const secret = new TextEncoder().encode(secretValue || "development-only-secret-change-me-32");
const isProduction = process.env.NODE_ENV === "production";
export type AuthUser = { id: string; email: string; name: string; role: "ATTENDEE" | "ORGANIZER" | "ADMIN" };
const sessionCookieOptions = { httpOnly: true, secure: isProduction, sameSite: "lax" as const, path: "/", maxAge: SESSION_MAX_AGE };
export async function setSession(user: AuthUser) { const token = await new SignJWT({ sub: user.id, id: user.id, email: user.email, name: user.name, role: user.role }).setProtectedHeader({ alg: JWT_ALGORITHM, typ: "JWT" }).setIssuedAt().setIssuer(JWT_ISSUER).setAudience(JWT_AUDIENCE).setExpirationTime(`${SESSION_MAX_AGE}s`).sign(secret); const cookieStore = await cookies(); cookieStore.set(COOKIE_NAME, token, sessionCookieOptions); }
export async function clearSession() { const cookieStore = await cookies(); cookieStore.set(COOKIE_NAME, "", { ...sessionCookieOptions, maxAge: 0, expires: new Date(0) }); }
export async function getAuthUser(): Promise<AuthUser | null> { const cookieStore = await cookies(); const token = cookieStore.get(COOKIE_NAME)?.value; if (!token) return null; try { const { payload } = await jwtVerify(token, secret, { algorithms: [JWT_ALGORITHM], issuer: JWT_ISSUER, audience: JWT_AUDIENCE }); if (typeof payload.sub !== "string" || typeof payload.email !== "string" || typeof payload.name !== "string" || typeof payload.role !== "string" || !["ATTENDEE", "ORGANIZER", "ADMIN"].includes(payload.role)) return null; const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, name: true, role: true } }); if (!user || user.email !== payload.email || user.name !== payload.name || user.role !== payload.role) return null; return user as AuthUser; } catch { return null; } }
export async function requireUser(): Promise<AuthUser> { const user = await getAuthUser(); if (!user) throw new Error("UNAUTHENTICATED"); return user; }
export async function requireRole(roles: AuthUser["role"][]): Promise<AuthUser> { const user = await requireUser(); if (!roles.includes(user.role)) throw new Error("FORBIDDEN"); return user; }
