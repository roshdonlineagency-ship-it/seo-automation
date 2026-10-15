import { NextResponse } from "next/server";
import { handleError, HttpError, requireProject, requireUser } from "@/lib/auth/guard";
import { getWpConnection, wpFetch } from "@/lib/security/wordpress";

const MAX_BYTES = 8 * 1024 * 1024;

function sniffType(b: Buffer): string | null {
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 12 && b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (b.length > 6 && ["GIF87a", "GIF89a"].includes(b.subarray(0, 6).toString())) return "image/gif";
  return null;
}
const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);

    const declared = Number(req.headers.get("content-length") || 0);
    if (declared > MAX_BYTES + 100_000) throw new HttpError(413, "حجم فایل زیاد است (حداکثر ۸ مگابایت)");

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "فایلی ارسال نشده است");
    if (file.size > MAX_BYTES) throw new HttpError(413, "حجم فایل زیاد است (حداکثر ۸ مگابایت)");

    const projectId = await requireProject(
      user.id,
      formData.get("projectId") ?? new URL(req.url).searchParams.get("projectId")
    );

    const buffer = Buffer.from(await file.arrayBuffer());
    const type = sniffType(buffer);
    if (!type) throw new HttpError(400, "فقط تصاویر PNG، JPG، WEBP و GIF مجاز است");

    // نام فایل سمت سرور بازسازی می‌شود
    const base = String(file.name || "image").replace(/\.[^.]*$/, "").replace(/[^\w\-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "image";
    const safeName = `${base}.${EXT[type]}`;

    const title = String(formData.get("title") ?? "").slice(0, 200);
    const altText = String(formData.get("alt_text") ?? "").slice(0, 300);

    const wpForm = new FormData();
    wpForm.append("file", new Blob([buffer], { type }), safeName);
    wpForm.append("title", title);
    wpForm.append("alt_text", altText);

    const conn = await getWpConnection(user.id, projectId);
    const response = await wpFetch(conn, "media", { method: "POST", body: wpForm });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("WordPress media error:", response.status, data?.message);
      throw new HttpError(502, "آپلود تصویر به وردپرس ناموفق بود");
    }
    return NextResponse.json({ url: data.source_url });
  } catch (e) {
    return handleError(e);
  }
}
