import { NextResponse } from "next/server";
import { handleError, HttpError, requireUser } from "@/lib/auth/guard";

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"];

export async function POST(req: Request) {
  try {
    await requireUser(req);
    const body = await req.json().catch(() => null);
    const prompt = String(body?.prompt ?? "");
    if (!prompt.trim()) throw new HttpError(400, "پرامپت الزامی است");
    if (prompt.length > 4000) throw new HttpError(413, "پرامپت بیش از حد طولانی است");

    // کلید در هدر می‌رود، نه در URL (تا در لاگ‌ها ثبت نشود)
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
        signal: AbortSignal.timeout(90_000),
      }
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Gemini image error:", response.status, data?.error?.message);
      throw new HttpError(502, "خطا در سرویس تولید تصویر");
    }

    const parts = data.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find((p: any) => p.inlineData);
    if (!imagePart?.inlineData?.data) throw new HttpError(502, "تصویر دریافت نشد");

    const mimeType = ALLOWED_MIME.includes(imagePart.inlineData.mimeType) ? imagePart.inlineData.mimeType : "image/png";
    return NextResponse.json({ url: `data:${mimeType};base64,${imagePart.inlineData.data}` });
  } catch (e) {
    return handleError(e);
  }
}
