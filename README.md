# Zolacoco Tarot(Vercel 版)

這是從 OpenAI Sites(Cloudflare Workers + D1)改造成標準 **Next.js + Vercel Postgres** 的版本,可以直接部署到 Vercel。

## 這次改了什麼

| 項目 | 原本 | 現在 |
|---|---|---|
| 資料庫 | Cloudflare D1(SQLite) | Vercel Postgres(透過 Drizzle ORM) |
| 會員登入 | OpenAI「Sign in with ChatGPT」 | Email + 密碼登入(NextAuth / Auth.js) |
| 執行環境 | Cloudflare Workers(vinext） | 標準 Next.js,可跑在 Vercel |

前端頁面(占卜牌陣、靈擺、星骰、療癒小房間等畫面與樣式)完全沒有更動,只換了背後存資料跟登入的方式。原本連結 `/signin-with-chatgpt`、`/signout-with-chatgpt` 的路徑保留下來,只是背後邏輯換成自己的登入系統,所以不用改前端程式碼。

## 部署到 Vercel 的步驟

### 1. 把程式碼放到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
```
建立一個 GitHub repository,把程式碼 push 上去。

### 2. 到 Vercel 匯入專案

到 [vercel.com](https://vercel.com) 用 GitHub 帳號登入 → **Add New → Project** → 選擇剛剛的 repo → Import。Vercel 會自動偵測到這是 Next.js 專案,不用改建置設定。

### 3. 建立 Postgres 資料庫

在 Vercel 專案頁面:**Storage → Create Database → Postgres**,建立完成後選擇 **Connect Project**,把它連結到這個專案。這一步會自動把 `DATABASE_URL` 加進專案的環境變數。

### 4. 設定其他環境變數

到專案的 **Settings → Environment Variables**,加入:

- `AUTH_SECRET`:隨便一組長亂碼字串即可(本機可執行 `npx auth secret` 幫你產生)
- `ADMIN_EMAIL`:你想要當管理員的 Email。用這個 Email 註冊帳號後,就能看到 `/admin` 後台

### 5. 建立資料表

本機把 repo clone 下來後(或直接在 Vercel 的部署 Log 確認建置成功後),在本機執行:

```bash
npm install
# 把 Vercel 專案設定裡的 DATABASE_URL 複製到 .env.local
npm run db:push
```

`db:push` 會依照 `db/schema.ts` 在 Postgres 建立所有資料表(會員、占卜紀錄等)。之後如果修改 schema,同樣執行這個指令即可同步。

### 6. 重新部署

回到 Vercel 專案頁面,點 **Deployments → 右上角 Redeploy**,確保新的環境變數生效。完成後打開網址,先用 `ADMIN_EMAIL` 對應的信箱註冊一個帳號,就能用「登入／註冊」連結進站,並在導覽列看到「查看後台」。

## 本機開發

```bash
npm install
cp .env.example .env.local   # 填入 DATABASE_URL、AUTH_SECRET、ADMIN_EMAIL
npm run db:push
npm run dev
```

## 保存的資料

- `users`:會員的 Email、暱稱、密碼(雜湊後)、是否為管理員
- `journal_entries`:七日內在筆記
- `pendulum_entries`:靈擺問答紀錄
- `astro_dice_entries`:星骰探索紀錄
- `user_activity_entries`:全站活動紀錄(塔羅抽牌、療癒小房間、元辰宮等)

管理員登入後可以在 `/admin` 看到所有會員與紀錄的總覽。
