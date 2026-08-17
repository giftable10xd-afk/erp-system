import "server-only";
import { cookies } from "next/headers";
import { hash, verify } from "@node-rs/argon2";
import { prisma } from "@/lib/prisma";
import type { PermissionKey } from "@/lib/permissions";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "erp_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14; // 14 يوم

export async function hashPassword(password: string) {
  return hash(password);
}

export async function verifyPassword(passwordHash: string, password: string) {
  return verify(passwordHash, password);
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const session = await prisma.session.create({
    data: { userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return session;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (sessionId) {
    await prisma.session.deleteMany({ where: { id: sessionId } });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export type SessionUser = {
  id: string;
  username: string;
  fullNameAr: string;
  isActive: boolean;
  permissions: Set<string>;
  roleKeys: string[];
};

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        include: {
          roles: {
            include: {
              role: { include: { permissions: { include: { permission: true } } } },
            },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    return null;
  }

  const permissions = new Set<string>();
  const roleKeys: string[] = [];
  for (const userRole of session.user.roles) {
    roleKeys.push(userRole.role.key);
    for (const rolePermission of userRole.role.permissions) {
      permissions.add(rolePermission.permission.key);
    }
  }

  return {
    id: session.user.id,
    username: session.user.username,
    fullNameAr: session.user.fullNameAr,
    isActive: session.user.isActive,
    permissions,
    roleKeys,
  };
}

export class UnauthorizedError extends Error {
  constructor(message = "غير مصرح لك بتنفيذ هذا الإجراء") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * الحارس المشترك لكل Server Action/Route Handler — التحقق الفعلي من الصلاحية
 * بيحصل هنا دايمًا، مش في الـ proxy (اللي بيعمل تحقق تفاؤلي بس زي ما توصي docs Next.js).
 */
export async function requirePermission(
  permission: PermissionKey
): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError("لازم تسجل الدخول أولًا");
  if (!session.permissions.has(permission)) {
    throw new UnauthorizedError();
  }
  return session;
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError("لازم تسجل الدخول أولًا");
  return session;
}
