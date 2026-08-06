import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { activityEntries, astroDiceEntries, journalEntries, pendulumEntries, users } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email) redirect(`/signin-with-chatgpt?return_to=${encodeURIComponent("/admin")}`);
  if (!session.user.isAdmin) redirect("/");

  const [entries, pendulumRows, astroDiceRows, activityRows, siteUsers] = await Promise.all([
    db
      .select({
        id: journalEntries.id,
        userEmail: journalEntries.userEmail,
        userName: journalEntries.userName,
        day: journalEntries.day,
        prompt: journalEntries.prompt,
        cardName: journalEntries.cardName,
        content: journalEntries.content,
        updatedAt: journalEntries.updatedAt,
      })
      .from(journalEntries)
      .orderBy(desc(journalEntries.updatedAt)),
    db
      .select({
        id: pendulumEntries.id,
        userEmail: pendulumEntries.userEmail,
        userName: pendulumEntries.userName,
        question: pendulumEntries.question,
        resultLabel: pendulumEntries.resultLabel,
        category: pendulumEntries.category,
        note: pendulumEntries.note,
        createdAt: pendulumEntries.createdAt,
      })
      .from(pendulumEntries)
      .orderBy(desc(pendulumEntries.createdAt)),
    db
      .select({
        id: astroDiceEntries.id,
        userEmail: astroDiceEntries.userEmail,
        userName: astroDiceEntries.userName,
        question: astroDiceEntries.question,
        category: astroDiceEntries.category,
        planetName: astroDiceEntries.planetName,
        signName: astroDiceEntries.signName,
        houseName: astroDiceEntries.houseName,
        note: astroDiceEntries.note,
        createdAt: astroDiceEntries.createdAt,
      })
      .from(astroDiceEntries)
      .orderBy(desc(astroDiceEntries.createdAt)),
    db
      .select({
        id: activityEntries.id,
        userEmail: activityEntries.userEmail,
        userName: activityEntries.userName,
        activityType: activityEntries.activityType,
        title: activityEntries.title,
        summary: activityEntries.summary,
        details: activityEntries.details,
        createdAt: activityEntries.createdAt,
      })
      .from(activityEntries)
      .orderBy(desc(activityEntries.createdAt)),
    db
      .select({
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
        lastSeenAt: users.lastSeenAt,
      })
      .from(users)
      .orderBy(desc(users.lastSeenAt)),
  ]);

  const people = new Map<string, { name: string; last: Date; count: number }>();
  const touch = (email: string, name: string | null, date: Date) => {
    const old = people.get(email);
    people.set(email, {
      name: name || old?.name || "未提供名稱",
      last: old && old.last > date ? old.last : date,
      count: (old?.count ?? 0) + 1,
    });
  };
  entries.forEach((x) => touch(x.userEmail, x.userName, x.updatedAt));
  pendulumRows.forEach((x) => touch(x.userEmail, x.userName, x.createdAt));
  astroDiceRows.forEach((x) => touch(x.userEmail, x.userName, x.createdAt));
  activityRows.forEach((x) => touch(x.userEmail, x.userName, x.createdAt));
  siteUsers.forEach((x) => {
    const old = people.get(x.email);
    people.set(x.email, {
      name: x.name || old?.name || "未提供名稱",
      last: old && old.last > x.lastSeenAt ? old.last : x.lastSeenAt,
      count: old?.count ?? 0,
    });
  });

  const fmt = (d: Date) => d.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });

  return (
    <main className="admin-page">
      <div className="admin-top">
        <div>
          <p className="eyebrow">ZOLACOCO TAROT · ADMIN</p>
          <h1>會員探索紀錄後台</h1>
        </div>
        <div>
          <Link href="/">返回網站</Link>　<a href="/signout-with-chatgpt?return_to=/">登出</a>
        </div>
      </div>

      <section className="admin-section">
        <h2>會員總覽</h2>
        <p className="admin-summary">目前共有 {people.size} 位留下紀錄的會員。以下整合全站資料,僅限 Zola 管理員查看。</p>
        {people.size === 0 ? (
          <div className="admin-empty">目前尚無會員紀錄。</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>會員</th>
                  <th>累計紀錄</th>
                  <th>最近活動</th>
                </tr>
              </thead>
              <tbody>
                {[...people.entries()]
                  .sort((a, b) => b[1].last.getTime() - a[1].last.getTime())
                  .map(([email, p]) => (
                    <tr key={email}>
                      <td>
                        <b>{p.name}</b>
                        <br />
                        <small>{email}</small>
                      </td>
                      <td>{p.count} 筆</td>
                      <td>{fmt(p.last)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2>全站活動紀錄</h2>
        <p className="admin-summary">
          包含塔羅抽牌、內在原型、牌面直覺、療癒小房間與元辰宮,共 {activityRows.length} 筆。
        </p>
        {activityRows.length === 0 ? (
          <div className="admin-empty">新版上線後,會員完成操作時會開始顯示。</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>使用者</th>
                  <th>功能</th>
                  <th>結果摘要</th>
                  <th>完整內容</th>
                  <th>時間</th>
                </tr>
              </thead>
              <tbody>
                {activityRows.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      {entry.userName || "未提供名稱"}
                      <br />
                      <small>{entry.userEmail}</small>
                    </td>
                    <td>
                      <b>{entry.title}</b>
                      <br />
                      <small>{entry.activityType}</small>
                    </td>
                    <td className="note-cell">{entry.summary || "—"}</td>
                    <td className="note-cell">
                      <details>
                        <summary>查看完整資料</summary>
                        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(entry.details), null, 2);
                            } catch {
                              return entry.details;
                            }
                          })()}
                        </pre>
                      </details>
                    </td>
                    <td>{fmt(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2>七日內在筆記</h2>
        <p className="admin-summary">目前共收到 {entries.length} 篇筆記。這裡只供 Zola 查看,請妥善保護使用者的內在探索內容。</p>
        {entries.length === 0 ? (
          <div className="admin-empty">目前還沒有使用者提交筆記。</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>使用者</th>
                  <th>天數／牌面</th>
                  <th>內在提問</th>
                  <th>筆記內容</th>
                  <th>更新時間</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      {entry.userName ?? "未提供名稱"}
                      <br />
                      <small>{entry.userEmail}</small>
                    </td>
                    <td>
                      DAY {entry.day}
                      <br />
                      {entry.cardName}
                    </td>
                    <td>{entry.prompt}</td>
                    <td className="note-cell">{entry.content}</td>
                    <td>{fmt(entry.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2>靈擺問答紀錄</h2>
        <p className="admin-summary">目前共收到 {pendulumRows.length} 次已登入會員的靈擺提問。</p>
        {pendulumRows.length === 0 ? (
          <div className="admin-empty">目前還沒有會員儲存靈擺問答。</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table pendulum-admin-table">
              <thead>
                <tr>
                  <th>使用者</th>
                  <th>分類／提問</th>
                  <th>靈擺結果</th>
                  <th>使用者感受</th>
                  <th>詢問時間</th>
                </tr>
              </thead>
              <tbody>
                {pendulumRows.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      {entry.userName ?? "未提供名稱"}
                      <br />
                      <small>{entry.userEmail}</small>
                    </td>
                    <td className="note-cell">
                      <small>{entry.category}</small>
                      <br />
                      {entry.question}
                    </td>
                    <td>
                      <b>{entry.resultLabel}</b>
                    </td>
                    <td className="note-cell">{entry.note || "—"}</td>
                    <td>{fmt(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2>星骰探索紀錄</h2>
        <p className="admin-summary">目前共收到 {astroDiceRows.length} 次已登入會員的星骰探索。</p>
        {astroDiceRows.length === 0 ? (
          <div className="admin-empty">目前還沒有會員儲存星骰紀錄。</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>使用者</th>
                  <th>分類／提問</th>
                  <th>星骰組合</th>
                  <th>內在筆記</th>
                  <th>擲骰時間</th>
                </tr>
              </thead>
              <tbody>
                {astroDiceRows.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      {entry.userName ?? "未提供名稱"}
                      <br />
                      <small>{entry.userEmail}</small>
                    </td>
                    <td className="note-cell">
                      <small>{entry.category}</small>
                      <br />
                      {entry.question}
                    </td>
                    <td>
                      <b>{entry.planetName}</b>
                      <br />
                      {entry.signName} × {entry.houseName}
                    </td>
                    <td className="note-cell">{entry.note || "—"}</td>
                    <td>{fmt(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
