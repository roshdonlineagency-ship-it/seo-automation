import { NextResponse } from "next/server";
import { handleError, HttpError, requireProject, requireUser } from "@/lib/auth/guard";
import { getWpConnection, wpFetch } from "@/lib/security/wordpress";

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const body = await req.json().catch(() => null);
    const projectId = await requireProject(user.id, body?.projectId);

    const title = String(body?.title ?? "").trim();
    const content = String(body?.content ?? "");
    if (!title || title.length > 300) throw new HttpError(400, "عنوان نامعتبر است");
    if (content.length > 500_000) throw new HttpError(413, "محتوا بیش از حد بزرگ است");

    const meta =
      body?.meta && typeof body.meta === "object" && !Array.isArray(body.meta) ? body.meta : {};

    const conn = await getWpConnection(user.id, projectId);
    const response = await wpFetch(conn, "posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        slug: body?.slug ? String(body.slug).slice(0, 200) : undefined,
        excerpt: body?.excerpt ? String(body.excerpt).slice(0, 1000) : undefined,
        status: "draft",
        meta,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("WordPress error:", response.status, data?.message);
      throw new HttpError(502, "وردپرس درخواست را نپذیرفت: " + String(data?.message ?? response.status).slice(0, 200));
    }
    return NextResponse.json({ success: true, postId: data.id, link: data.link });
  } catch (e) {
    return handleError(e);
  }
}
