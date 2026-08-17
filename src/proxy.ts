import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "erp_session";

// تحقق تفاؤلي بس (وجود الكوكي) — التحقق الفعلي من الجلسة والصلاحيات
// بيحصل دايمًا جوه requireSession/requirePermission في lib/auth.ts.
// "/" مستبعدة من الاتنين — صفحتها بترجّع بنفسها لـ /start (لو مفيش جلسة)
// أو getDefaultLandingPath (لو فيه)، فمش محتاجة الـ proxy يتدخل فيها.
const UNAUTH_ACCESSIBLE_PATHS = new Set(["/login", "/start", "/"]);
// "/start" مستبعدة عمدًا من هنا: التحقق التفاؤلي بس (وجود كوكي) يفرق عن
// التحقق الحقيقي جوه getSession() (التوكن ممكن يكون منتهي/باطل). لو كوكي
// قديمة موجودة بس الجلسة فعليًا باظت، عمل bounce هنا كان بيرجّع المستخدم
// لـ "/" واللي بترجّعه هي كمان لـ "/start" (لأن getSession() الحقيقي بيرجّع
// null) — لووب لا نهائي. صفحة /start بتعمل نفس التحقق بنفسها بعد ما تتأكد
// من الجلسة الحقيقية، فمحتاجة تفضل قابلة للوصول من هنا دايمًا.
const BOUNCE_IF_AUTHENTICATED_PATHS = new Set(["/login"]);

export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);
  const { pathname } = request.nextUrl;

  // بوابة العميل (/portal/...) عامة بالكامل — الحماية بتحصل بمطابقة
  // portalToken جوه الصفحة نفسها مش عبر جلسة تسجيل دخول.
  if (pathname.startsWith("/portal")) {
    return NextResponse.next();
  }

  if (!hasSessionCookie && !UNAUTH_ACCESSIBLE_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSessionCookie && BOUNCE_IF_AUTHENTICATED_PATHS.has(pathname)) {
    // بيوجه لـ "/" مش "/dashboard" مباشرة — الداشبورد للمالك بس، و"/"
    // بتحسب أول صفحة متاحة فعليًا حسب صلاحيات المستخدم (شوف nav-items.ts)
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // مستبعد منها: مسارات Next.js الداخلية + أي ملف استاتيك (خطوط، صور، PWA
  // manifest/service worker) عشان لو المستخدم مش داخل، طلب ملف زي الخطوط أو
  // sw.js ميترجعش صفحة /login بالغلط (نفس المشكلة اللي حصلت مع الخطوط)
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|fonts/|manifest.json|sw.js|icon.svg|.*\\.(?:ttf|otf|woff|woff2|svg|png|jpg|jpeg|gif|webp|ico|json|js)$).*)",
  ],
};
