import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDefaultLandingPath } from "@/lib/nav-items";
import { demoLoginAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  ShieldCheck,
  Wrench,
  Receipt,
  Package,
  Handshake,
  LifeBuoy,
} from "lucide-react";

const ROLE_CARDS = [
  {
    username: "owner",
    nameAr: "المالك",
    roleAr: "رؤية شاملة على كل الأقسام",
    icon: ShieldCheck,
  },
  {
    username: "eng1",
    nameAr: "المهندس كريم فوزي",
    roleAr: "مهندس — صيانة",
    icon: Wrench,
  },
  {
    username: "accountant1",
    nameAr: "هالة عبد الرحمن",
    roleAr: "محاسب — فواتير وعروض أسعار",
    icon: Receipt,
  },
  {
    username: "warehouse1",
    nameAr: "محمد إبراهيم",
    roleAr: "أمين مخزن",
    icon: Package,
  },
  {
    username: "rental1",
    nameAr: "منى الشناوي",
    roleAr: "مسؤول الإيجارات",
    icon: Handshake,
  },
  {
    username: "support1",
    nameAr: "كريم فتحي",
    roleAr: "موظف الدعم الفني",
    icon: LifeBuoy,
  },
];

export default async function StartPage() {
  const session = await getSession();
  if (session) redirect(getDefaultLandingPath(session.permissions));

  const demoEnabled = process.env.ALLOW_DEMO_LOGIN === "true";

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-gradient-to-br from-sidebar via-primary to-secondary px-4 py-10">
      <div className="flex flex-col items-center text-center">
        <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
          <Building2 className="size-8 text-white" />
        </span>
        <h1 className="text-2xl font-bold text-white">نظام إدارة الشركة</h1>
        <p className="mt-1 text-sm text-white/80">
          {demoEnabled
            ? "اختار دورك للدخول التجريبي — بدون كلمة سر"
            : "الدخول التجريبي متوقف حاليًا"}
        </p>
      </div>

      {demoEnabled ? (
        <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_CARDS.map((role) => {
            const Icon = role.icon;
            return (
              <Card key={role.username} className="border-0 shadow-2xl">
                <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15">
                    <Icon className="size-6 text-primary" />
                  </span>
                  <div>
                    <p className="font-bold">{role.nameAr}</p>
                    <p className="text-sm text-muted-foreground">{role.roleAr}</p>
                  </div>
                  <form action={demoLoginAction} className="w-full">
                    <input type="hidden" name="username" value={role.username} />
                    <Button type="submit" className="w-full">
                      دخول
                    </Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="w-full max-w-sm border-0 shadow-2xl">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            برجاء تسجيل الدخول ببيانات حقيقية.
          </CardContent>
        </Card>
      )}

      <Link href="/login" className="text-sm text-white/80 underline-offset-4 hover:underline">
        عندك حساب حقيقي؟ سجّل الدخول من هنا
      </Link>
    </div>
  );
}
