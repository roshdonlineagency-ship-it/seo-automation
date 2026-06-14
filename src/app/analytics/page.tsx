"use client";

import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-10" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="text-white/40 hover:text-white text-sm mb-8 flex items-center gap-2 transition-colors"
        >
          ← برگشت
        </button>

        <p className="text-white/40 text-sm mb-1">آنالیتیکس</p>
        <h1 className="text-4xl font-bold mb-10 tracking-tight">
          Analytics
        </h1>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Update Suggestions */}
          <button
            onClick={() => router.push("/analytics/update-suggestions")}
            className="group bg-white/5 border border-white/10 rounded-3xl p-8 text-right hover:bg-white/10 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6">
              📈
            </div>

            <h2 className="text-xl font-semibold mb-2">
              پیشنهاد آپدیت
            </h2>

            <p className="text-sm text-white/40 leading-7">
              مشاهده صفحاتی که نیاز به بروزرسانی محتوا،
              بهبود سئو یا تکمیل اطلاعات دارند.
            </p>

            <div className="mt-6 text-violet-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              مشاهده →
            </div>
          </button>

          {/* Progress Report */}
          <button
            onClick={() => router.push("/analytics/progress-report")}
            className="group bg-white/5 border border-white/10 rounded-3xl p-8 text-right hover:bg-white/10 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6">
              📊
            </div>

            <h2 className="text-xl font-semibold mb-2">
              گزارش پیشرفت
            </h2>

            <p className="text-sm text-white/40 leading-7">
              بررسی روند رشد پروژه، تعداد محتواهای
              منتشر شده و وضعیت اجرای برنامه‌ها.
            </p>

            <div className="mt-6 text-violet-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              مشاهده →
            </div>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-10 bg-white/5 border border-white/10 rounded-3xl p-6">
          <p className="text-white/40 text-sm mb-6">
            خلاصه وضعیت
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/20 border border-white/5 rounded-2xl p-4">
              <div className="text-2xl font-bold">24</div>
              <div className="text-xs text-white/40 mt-1">
                صفحات بررسی شده
              </div>
            </div>

            <div className="bg-black/20 border border-white/5 rounded-2xl p-4">
              <div className="text-2xl font-bold">8</div>
              <div className="text-xs text-white/40 mt-1">
                پیشنهاد آپدیت
              </div>
            </div>

            <div className="bg-black/20 border border-white/5 rounded-2xl p-4">
              <div className="text-2xl font-bold">71%</div>
              <div className="text-xs text-white/40 mt-1">
                پیشرفت برنامه
              </div>
            </div>

            <div className="bg-black/20 border border-white/5 rounded-2xl p-4">
              <div className="text-2xl font-bold">132</div>
              <div className="text-xs text-white/40 mt-1">
                محتوای منتشر شده
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
