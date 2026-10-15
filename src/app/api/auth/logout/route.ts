import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { handleError, requireUser } from "@/lib/auth/guard";

export async function POST(req: Request) {
  try {
    await requireUser(req);
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
