import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ user: null });

  const now = new Date();
  await db.update(users).set({ lastSeenAt: now }).where(eq(users.email, session.user.email));

  return Response.json({
    user: {
      displayName: session.user.name ?? session.user.email,
      email: session.user.email,
      isAdmin: Boolean(session.user.isAdmin),
    },
  });
}
