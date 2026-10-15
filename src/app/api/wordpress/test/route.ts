import { NextResponse } from "next/server";
import { handleError, requireProject, requireUser } from "@/lib/auth/guard";
import { getWpConnection, wpFetch } from "@/lib/security/wordpress";

// تست اتصال: فقط برای پروژه خود کاربر و بدون افشای نام کاربری/رمز
export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const projectId = await requireProject(user.id, new URL(req.url).searchParams.get("projectId"));
    const conn = await getWpConnection(user.id, projectId);
    const res = await wpFetch(conn, "users/me?context=edit", { method: "GET" });
    return NextResponse.json({ connected: res.ok, status: res.status });
  } catch (e) {
    return handleError(e);
  }
}
