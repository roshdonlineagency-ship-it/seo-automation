import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // ۱. دریافت اطلاعات از بدنه درخواست (به جای سخت‌کد کردن)
    const { projectId, title, content } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "projectId الزامی است" }, { status: 400 });
    }

    // ۲. کوئری به دیتابیس با استفاده از ستون project_id (که در تصویر دیدیم)
    const { rows } = await sql`
      SELECT wordpress_url, wordpress_username, wordpress_app_password
      FROM brand_info
      WHERE project_id = ${Number(projectId)}
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json(
        { error: `اطلاعات وردپرس برای پروژه ${projectId} یافت نشد` },
        { status: 404 }
      );
    }

    const brand = rows[0];

    // ۳. آماده‌سازی توکن اتصال
    const token = Buffer.from(
      `${brand.wordpress_username}:${brand.wordpress_app_password}`
    ).toString("base64");

    // ۴. ارسال درخواست انتشار به وردپرس
    const response = await fetch(
      `${brand.wordpress_url}/wp-json/wp/v2/posts`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title || "بدون عنوان",
          content: content || "",
          status: "draft", // می‌توانید به "publish" تغییر دهید
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "خطا در وردپرس" }, { status: response.status });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("Publish Error:", error);
    return NextResponse.json(
      { error: "خطا در سرور هنگام انتشار" },
      { status: 500 }
    );
  }
}
