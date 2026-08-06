import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { astroDiceEntries } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "請先登入" }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const question = String(body.question ?? "").trim().slice(0, 180);
  const category = String(body.category ?? "").trim().slice(0, 24);
  const planet = String(body.planet ?? "").trim().slice(0, 24);
  const sign = String(body.sign ?? "").trim().slice(0, 24);
  const house = String(body.house ?? "").trim().slice(0, 24);
  const note = String(body.note ?? "").trim().slice(0, 600);
  if (!question || !category || !planet || !sign || !house) {
    return Response.json({ error: "星骰紀錄不完整" }, { status: 400 });
  }

  const now = new Date();
  await db.insert(astroDiceEntries).values({
    userEmail: session.user.email,
    userName: session.user.name ?? session.user.email,
    question,
    category,
    planetName: planet,
    signName: sign,
    houseName: house,
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
      id: astroDiceEntries.id,
      question: astroDiceEntries.question,
      category: astroDiceEntries.category,
      planetName: astroDiceEntries.planetName,
      signName: astroDiceEntries.signName,
      houseName: astroDiceEntries.houseName,
      note: astroDiceEntries.note,
      createdAt: astroDiceEntries.createdAt,
    })
    .from(astroDiceEntries)
    .where(eq(astroDiceEntries.userEmail, session.user.email))
    .orderBy(desc(astroDiceEntries.createdAt))
    .limit(30);

  return Response.json({ entries });
}
