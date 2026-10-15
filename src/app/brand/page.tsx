"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BrandInfo() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    url: "",
    description: "",
    tone: "رسمی",
  });

  const tones = ["رسمی", "دوستانه", "تخصصی", "خلاقانه"];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-10" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-white/40 hover:text-white text-sm mb-8 flex items-center gap-2 transition-colors"
        >
          ← برگشت
        </button>

        <h1 className="text-3xl font-bold mb-2">اطلاعات اولیه</h1>
        <p className="text-white/40 mb-10">مدیریت لوگو و هویت برند</p>

        <div className="flex flex-col gap-5">
          <div>
            <label className="text-sm text-white/60 mb-2 block">نام برند</label>
            <input
              type="text"
              placeholder="مثلاً: دیجی‌کالا"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder:text-white/20"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 mb-2 block">آدرس سایت</label>
            <input
              type="text"
              placeholder="https://example.com"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder:text-white/20"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 mb-2 block">توضیح برند</label>
            <textarea
              rows={4}
              placeholder="برند شما چه کاری انجام میده؟"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder:text-white/20 resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 mb-2 block">لحن برند</label>
            <div className="flex gap-3 flex-wrap">
              {tones.map((tone) => (
                <button
                  key={tone}
                  onClick={() => setForm({ ...form, tone })}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                    form.tone === tone
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <button className="mt-4 bg-violet-600 hover:bg-violet-500 transition-colors py-3 rounded-xl font-medium">
            ذخیره اطلاعات
          </button>
        </div>
      </div>
    </div>
  );
}
