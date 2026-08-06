import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string; name?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim().slice(0, 60);

  if (!email || !email.includes("@") || email.length > 200) {
    return Response.json({ error: "請輸入有效的 Email" }, { status: 400 });
  }
  if (password.length < 6 || password.length > 200) {
    return Response.json({ error: "密碼長度至少需要 6 碼" }, { status: 400 });
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return Response.json({ error: "這個 Email 已經註冊過了,請直接登入" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const isAdmin = email === (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const now = new Date();

  await db.insert(users).values({
    email,
    name: name || email,
    passwordHash,
    isAdmin,
    createdAt: now,
    lastSeenAt: now,
  });

  return Response.json({ ok: true });
}
