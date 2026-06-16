import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const projectId = 1;

    const { rows } = await sql`
      SELECT *
      FROM brand_info
      WHERE project_id = ${projectId}
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json(
        { error: "brand_info پیدا نشد" },
        { status: 404 }
      );
    }

    const brand = rows[0];

    const token = Buffer.from(
      `${brand.wordpress_username}:${brand.wordpress_app_password}`
    ).toString("base64");

    const response = await fetch(
      `${brand.wordpress_url}/wp-json/wp/v2/posts`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "تست انتشار از سیستم",
          content: `
            <h2>تست اتصال وردپرس</h2>
            <p>اگر این پست ایجاد شده یعنی ارتباط موفق است.</p>
          `,
          status: "draft",
        }),
      }
    );

    const data = await response.json();

    return NextResponse.json({
      status: response.status,
      data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "خطا در انتشار تستی" },
      { status: 500 }
    );
  }
}
