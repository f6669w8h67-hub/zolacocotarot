import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// 會員資料表(取代原本的 Cloudflare D1 site_users + OpenAI SIWC 登入)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

// 七日內在筆記
export const journalEntries = pgTable(
  "journal_entries",
  {
    id: serial("id").primaryKey(),
    userEmail: text("user_email").notNull(),
    userName: text("user_name"),
    day: integer("day").notNull(),
    prompt: text("prompt").notNull(),
    cardId: text("card_id").notNull(),
    cardName: text("card_name").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("journal_user_day_idx").on(table.userEmail, table.day)],
);

// 靈擺問答紀錄
export const pendulumEntries = pgTable("pendulum_entries", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  userName: text("user_name"),
  question: text("question").notNull(),
  result: text("result").notNull(),
  resultLabel: text("result_label").notNull(),
  category: text("category").notNull().default("內在指引"),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 星骰探索紀錄
export const astroDiceEntries = pgTable(
  "astro_dice_entries",
  {
    id: serial("id").primaryKey(),
    userEmail: text("user_email").notNull(),
    userName: text("user_name"),
    question: text("question").notNull(),
    category: text("category").notNull(),
    planetName: text("planet_name").notNull(),
    signName: text("sign_name").notNull(),
    houseName: text("house_name").notNull(),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("astro_dice_user_created_idx").on(table.userEmail, table.createdAt)],
);

// 全站活動紀錄(塔羅抽牌、療癒小房間、元辰宮…等)
export const activityEntries = pgTable(
  "user_activity_entries",
  {
    id: serial("id").primaryKey(),
    userEmail: text("user_email").notNull(),
    userName: text("user_name"),
    activityType: text("activity_type").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    details: text("details").notNull().default("{}"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("activity_user_created_idx").on(table.userEmail, table.createdAt)],
);
