import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDefaultLandingPath } from "@/lib/nav-items";
import { LoginForm } from "./login-form";
import { Building2 } from "lucide-react";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(getDefaultLandingPath(session.permissions));

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-sidebar via-primary to-secondary px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
            <Building2 className="size-8 text-white" />
          </span>
          <h1 className="text-2xl font-bold text-white">نظام إدارة الشركة</h1>
          <p className="mt-1 text-sm text-white/80">سجّل الدخول للمتابعة</p>
        </div>
        <LoginForm />
        {process.env.ALLOW_DEMO_LOGIN === "true" && (
          <Link
            href="/start"
            className="mt-4 block text-center text-sm text-white/80 underline-offset-4 hover:underline"
          >
            رجوع لاختيار دور تجريبي
          </Link>
        )}
      </div>
    </div>
  );
}
