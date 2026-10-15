import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// لایه اول: فقط وجود کوکی را برای هدایت صفحات بررسی می‌کند.
// اعتبار واقعی نشست در هر API با requireUser() و دیتابیس بررسی می‌شود.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCookie = request.cookies.has("sid");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (!hasCookie && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
