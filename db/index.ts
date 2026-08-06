import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// 在開發模式下 Next.js 會因為熱重載重複建立連線,所以把 client 掛在 global 上重複利用。
declare global {
  // eslint-disable-next-line no-var
  var __tarotDbClient: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "環境變數 DATABASE_URL 未設定。請在 Vercel 專案的 Storage 中建立 Postgres 資料庫並連結," +
        "或在本機 .env.local 中設定 DATABASE_URL。",
    );
  }
  return postgres(connectionString, { max: 1 });
}

const client = globalThis.__tarotDbClient ?? createClient();
if (process.env.NODE_ENV !== "production") {
  globalThis.__tarotDbClient = client;
}

export const db = drizzle(client, { schema });
