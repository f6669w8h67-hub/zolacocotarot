import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { journalEntries } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "請先登入" }, { status: 401 });

  const entries = await db
    .select({
      day: journalEntries.day,
      prompt: journalEntries.prompt,
      cardId: journalEntries.cardId,
      cardName: journalEntries.cardName,
      content: journalEntries.content,
      updatedAt: journalEntries.updatedAt,
    })
    .from(journalEntries)
    .where(eq(journalEntries.userEmail, session.user.email))
    .orderBy(journalEntries.day);

  return Response.json({ entries });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "請先登入" }, { status: 401 });

  const body = (await request.json()) as {
    day?: number;
    prompt?: string;
    cardId?: string;
    cardName?: string;
    content?: string;
  };
  const day = Number(body.day);
  const content = String(body.content ?? "").trim();
  if (!Number.isInteger(day) || day < 1 || day > 7 || !content || content.length > 8000) {
    return Response.json({ error: "筆記內容不完整" }, { status: 400 });
  }

  const prompt = String(body.prompt ?? "");
  const cardId = String(body.cardId ?? "");
  const cardName = String(body.cardName ?? "");
  const now = new Date();

  await db
    .insert(journalEntries)
    .values({
      userEmail: session.user.email,
      userName: session.user.name ?? session.user.email,
      day,
      prompt,
      cardId,
      cardName,
      content,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [journalEntries.userEmail, journalEntries.day],
      set: {
        prompt,
        cardId,
        cardName,
        content,
        userName: session.user.name ?? session.user.email,
        updatedAt: now,
      },
    });

  return Response.json({ saved: true, updatedAt: now.toISOString() });
}
