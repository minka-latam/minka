import { NextResponse } from "next/server";
import {
  PASSWORD_RECOVERY_COOKIE,
  PASSWORD_RECOVERY_COOKIE_OPTIONS,
} from "@/lib/password-recovery-session";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    PASSWORD_RECOVERY_COOKIE,
    "1",
    PASSWORD_RECOVERY_COOKIE_OPTIONS,
  );

  return response;
}
