import { auth } from "@/auth";
import { db } from "@/db";
import { activityEntries } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ saved: false }, { status: 401 });

  const body = (await request.json()) as {
    type?: string;
    title?: string;
    summary?: string;
    details?: unknown;
  };
  const type = String(body.type ?? "").trim().slice(0, 50);
  const title = String(body.title ?? "").trim().slice(0, 120);
  const summary = String(body.summary ?? "").trim().slice(0, 1200);
  if (!type || !title) return Response.json({ error: "紀錄不完整" }, { status: 400 });

  let details = "{}";
  try {
    details = JSON.stringify(body.details ?? {}).slice(0, 16000);
  } catch {
    // keep empty object
  }

  const now = new Date();
  await db.insert(activityEntries).values({
    userEmail: session.user.email,
    userName: session.user.name ?? session.user.email,
    activityType: type,
    title,
    summary,
    details,
    createdAt: now,
  });

  return Response.json({ saved: true, createdAt: now.toISOString() });
}
