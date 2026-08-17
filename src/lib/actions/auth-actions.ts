"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, verifyPassword, getSession } from "@/lib/auth";
import { getDefaultLandingPath } from "@/lib/nav-items";

const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export type LoginState = { error?: string } | undefined;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "برجاء إدخال اسم المستخدم وكلمة المرور" };
  }

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });

  if (!user || !user.isActive) {
    return { error: "بيانات الدخول غير صحيحة" };
  }

  const validPassword = await verifyPassword(user.passwordHash, parsed.data.password);
  if (!validPassword) {
    return { error: "بيانات الدخول غير صحيحة" };
  }

  await createSession(user.id);
  const session = await getSession();
  redirect(session ? getDefaultLandingPath(session.permissions) : "/login");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

// قائمة مقفلة من مستخدمي الديمو المزروعين في prisma/seed-demo.ts — مش أي
// اسم مستخدم عشوائي، وده اللي بيفرق الدخول التجريبي ده عن تعطيل الباسورد
// بالكامل. راجع .env لتفعيل/تعطيل ALLOW_DEMO_LOGIN.
const DEMO_USERNAMES = [
  "owner",
  "eng1",
  "eng2",
  "accountant1",
  "warehouse1",
  "rental1",
  "support1",
];

export async function demoLoginAction(formData: FormData) {
  if (process.env.ALLOW_DEMO_LOGIN !== "true") {
    redirect("/login");
  }

  const username = formData.get("username");
  if (typeof username !== "string" || !DEMO_USERNAMES.includes(username)) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.isActive) {
    redirect("/login");
  }

  await createSession(user.id);
  const session = await getSession();
  redirect(session ? getDefaultLandingPath(session.permissions) : "/login");
}
