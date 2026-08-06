import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/auth";

export async function GET(request: NextRequest) {
  const returnToParam = request.nextUrl.searchParams.get("return_to") ?? "/";
  const returnTo =
    returnToParam.startsWith("/") && !returnToParam.startsWith("//") ? returnToParam : "/";

  try {
    await signOut({ redirect: false });
  } catch {
    // 即使清除 session 失敗,仍導回原本頁面,避免使用者卡住
  }

  return NextResponse.redirect(new URL(returnTo, request.url));
}
