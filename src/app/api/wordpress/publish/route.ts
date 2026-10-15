import { NextResponse } from "next/server";
import { handleError, HttpError, requireProject, requireUser } from "@/lib/auth/guard";
import { getWpConnection, wpFetch } from "@/lib/security/wordpress";

// نسخه ساده‌تر انتشار؛ همان زیرساخت امن مسیر /api/wordpress را استفاده می‌کند
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const body = await req.json().catch(() => null);
    const projectId = await requireProject(user.id, body?.projectId);

    const title = String(body?.title ?? "").trim() || "بدون عنوان";
    const content = String(body?.content ?? "");
    if (title.length > 300 || content.length > 500_000) throw new HttpError(413, "ورودی بیش از حد بزرگ است");

    const conn = await getWpConnection(user.id, projectId);
    const response = await wpFetch(conn, "posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, status: "draft" }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new HttpError(502, "وردپرس درخواست را نپذیرفت");
    return NextResponse.json({ success: true, postId: data.id, link: data.link });
  } catch (e) {
    return handleError(e);
  }
}
