import { lookup } from "dns/promises";
import { isIP } from "net";
import { sql } from "@vercel/postgres";
import { HttpError } from "@/lib/auth/guard";

function isPrivateIPv4(ip: string) {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function isPrivateIp(ip: string) {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  if (v6 === "::1" || v6 === "::") return true;
  if (v6.startsWith("::ffff:")) return isPrivateIPv4(v6.slice(7));
  return v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe8") ||
    v6.startsWith("fe9") || v6.startsWith("fea") || v6.startsWith("feb");
}

async function assertSafeBase(raw: string): Promise<string> {
  let u: URL;
  try { u = new URL(raw); } catch { throw new HttpError(400, "آدرس وردپرس نامعتبر است"); }

  const allowHttp = process.env.WP_ALLOW_HTTP === "true";
  if (u.protocol !== "https:" && !(allowHttp && u.protocol === "http:")) {
    throw new HttpError(400, "آدرس وردپرس باید HTTPS باشد");
  }
  if (u.username || u.password) throw new HttpError(400, "آدرس وردپرس نباید شامل نام کاربری باشد");

  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new HttpError(400, "مقصد مجاز نیست");
  }
  const addrs = isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true }).catch(() => { throw new HttpError(502, "دامنه وردپرس پیدا نشد"); });
  if (addrs.some((a) => isPrivateIp(a.address))) throw new HttpError(400, "مقصد مجاز نیست");

  return u.origin + u.pathname.replace(/\/+$/, "");
}

export type WpConnection = { base: string; auth: string };

// اتصال وردپرس فقط برای پروژه‌ای که مال همین کاربر است خوانده می‌شود
export async function getWpConnection(userId: number, projectId: number): Promise<WpConnection> {
  const { rows } = await sql`
    SELECT b.wordpress_url, b.wordpress_username, b.wordpress_app_password
    FROM brand_info b
    JOIN projects p ON p.id = b.project_id
    WHERE b.project_id = ${projectId} AND p.user_id = ${userId}
    LIMIT 1
  `;
  const r = rows[0];
  if (!r?.wordpress_url || !r.wordpress_username || !r.wordpress_app_password) {
    throw new HttpError(404, "اطلاعات اتصال وردپرس برای این پروژه تنظیم نشده است");
  }
  const base = await assertSafeBase(String(r.wordpress_url));
  const auth = Buffer.from(`${r.wordpress_username}:${r.wordpress_app_password}`).toString("base64");
  return { base, auth };
}

export async function wpFetch(conn: WpConnection, path: string, init: RequestInit) {
  const res = await fetch(`${conn.base}/wp-json/wp/v2/${path}`, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Basic ${conn.auth}` },
    redirect: "manual",
    signal: AbortSignal.timeout(30_000),
  });
  if (res.status >= 300 && res.status < 400) {
    throw new HttpError(502, "وردپرس درخواست را ریدایرکت کرد؛ آدرس سایت را بررسی کن (http/https یا www)");
  }
  return res;
}
