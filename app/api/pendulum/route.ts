import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { pendulumEntries } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "請先登入" }, { status: 401 });

  const body = (await request.json()) as {
    question?: string;
    result?: string;
    resultLabel?: string;
    category?: string;
    note?: string;
  };
  const question = String(body.question ?? "").trim();
  const result = String(body.result ?? "").trim().slice(0, 40);
  const legacyLabels: Record<string, string> = { yes: "是", no: "否", unclear: "目前不明確" };
  const resultLabel = String(body.resultLabel ?? legacyLabels[result] ?? "")
    .trim()
    .slice(0, 80);
  if (!question || question.length > 180 || !result || !resultLabel) {
    return Response.json({ error: "問題或結果不完整" }, { status: 400 });
  }

  const category = String(body.category ?? "內在指引").slice(0, 24);
  const note = String(body.note ?? "").trim().slice(0, 500);
  const now = new Date();

  await db.insert(pendulumEntries).values({
    userEmail: session.user.email,
    userName: session.user.name ?? session.user.email,
    question,
    result,
    resultLabel,
    category,
    note,
    createdAt: now,
  });

  return Response.json({ saved: true, createdAt: now.toISOString() });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "請先登入" }, { status: 401 });

  const entries = await db
    .select({
      id: pendulumEntries.id,
      question: pendulumEntries.question,
      result: pendulumEntries.result,
      resultLabel: pendulumEntries.resultLabel,
      category: pendulumEntries.category,
      note: pendulumEntries.note,
      createdAt: pendulumEntries.createdAt,
    })
    .from(pendulumEntries)
    .where(eq(pendulumEntries.userEmail, session.user.email))
    .orderBy(desc(pendulumEntries.createdAt))
    .limit(20);

  return Response.json({ entries });
}
