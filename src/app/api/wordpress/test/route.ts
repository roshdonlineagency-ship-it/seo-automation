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
      `${brand.wordpress_url}/wp-json/wp/v2/users/me`,
      {
        headers: {
          Authorization: `Basic ${token}`,
        },
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "خطا در تست وردپرس" },
      { status: 500 }
    );
  }
}
