import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { NAV_ITEMS } from "@/lib/nav-items";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Building2 } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { PERMISSIONS } from "@/lib/permissions";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { PageTransition } from "@/components/page-transition";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.permission === null || session.permissions.has(item.permission)
  );

  return (
    <div className="flex min-h-screen w-full">
      <aside className="flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary/15">
            <Building2 className="size-4.5 text-sidebar-primary" />
          </span>
          <span className="text-right font-heading text-base font-bold text-sidebar-accent-foreground">نظام إدارة الشركة</span>
        </div>
        <SidebarNav items={visibleItems} />
        <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground/70">
          © {new Date().getFullYear()} — نظام داخلي
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-6 shadow-sm shadow-black/20">
          <form action="/search" method="GET" className="relative w-72 max-w-full">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              placeholder="بحث شامل..."
              className="ps-9"
            />
          </form>
          <div className="flex items-center gap-3">
            {session.permissions.has(PERMISSIONS.ALERTS_READ) && <NotificationBell />}
            <div className="text-end">
              <p className="text-sm font-medium">{session.fullNameAr}</p>
              <p className="text-xs text-muted-foreground">
                {session.roleKeys.join("، ")}
              </p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {session.fullNameAr.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <form action={logoutAction}>
              <Button variant="ghost" size="icon" type="submit" aria-label="تسجيل الخروج">
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
