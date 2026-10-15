"use client";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "ورود ناموفق بود");
      window.location.href = "/";
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const input =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder:text-white/20";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-10 flex items-center justify-center" dir="rtl">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-2">ورود</h1>
        <p className="text-white/40 mb-8 text-sm">به مرکز فرماندهی سئو وارد شو</p>
        <div className="flex flex-col gap-4">
          <input type="email" dir="ltr" placeholder="ایمیل" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          <input
            type="password"
            dir="ltr"
            placeholder="رمز عبور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className={input}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={submit}
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors py-3 rounded-xl text-sm font-medium"
          >
            {loading ? "در حال ورود..." : "ورود"}
          </button>
          <Link href="/register" className="text-white/40 hover:text-white text-sm text-center transition-colors">
            حساب ندارم؛ ثبت‌نام
          </Link>
        </div>
      </div>
    </div>
  );
}
