"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("return_to"));

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(data.error ?? "註冊失敗,請稍後再試");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email 或密碼不正確");
        setLoading(false);
        return;
      }

      router.push(returnTo);
      router.refresh();
    } catch {
      setError("發生錯誤,請稍後再試");
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#0b0713",
        color: "#f4ecff",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "380px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "16px",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div>
          <p style={{ opacity: 0.6, fontSize: "13px", letterSpacing: "0.08em" }}>
            ZOLACOCO TAROT
          </p>
          <h1 style={{ fontSize: "22px", margin: "4px 0 0" }}>
            {mode === "login" ? "登入會員" : "註冊新會員"}
          </h1>
        </div>

        {mode === "register" && (
          <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "13px", opacity: 0.75 }}>暱稱</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="想被怎麼稱呼呢?"
              style={inputStyle}
            />
          </label>
        )}

        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "13px", opacity: 0.75 }}>Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "13px", opacity: 0.75 }}>密碼</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 碼"
            style={inputStyle}
          />
        </label>

        {error && (
          <p style={{ color: "#ff9fb0", fontSize: "13px", margin: 0 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "8px",
            padding: "12px",
            borderRadius: "999px",
            border: "none",
            background: loading ? "#6b5b95" : "#a684ff",
            color: "#0b0713",
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "處理中…" : mode === "login" ? "登入" : "註冊並登入"}
        </button>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setMode(mode === "login" ? "register" : "login");
          }}
          style={{
            background: "none",
            border: "none",
            color: "#c9b8ff",
            fontSize: "13px",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {mode === "login" ? "還沒有帳號嗎?點此註冊" : "已經有帳號了?點此登入"}
        </button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  color: "#f4ecff",
  fontSize: "14px",
};

// 避免 open redirect:只允許站內相對路徑
function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
