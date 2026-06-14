"use client";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const cards = [
    { icon: "🏢", title: "اطلاعات اولیه", desc: "مدیریت لوگو و هویت برند", color: "from-violet-500/20 to-violet-500/5", href: "/brand" },
    { icon: "⚡", title: "پرامپت‌ها", desc: "تنظیم دستورات هوش مصنوعی", color: "from-blue-500/20 to-blue-500/5", href: "/prompts" },
    { icon: "🤖", title: "فرایندهای اتوماتیک", desc: "مدیریت سناریوهای خودکار", color: "from-emerald-500/20 to-emerald-500/5", href: "/automation" },
    { icon: "📊", title: "تحلیل و پیشنهاد", desc: "داشبورد آماری و خروجی‌ها", color: "from-amber-500/20 to-amber-500/5", href: "/analytics" },
  ];
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-10" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <p className="text-white/40 text-sm mb-1">خوش اومدی 👋</p>
        <h1 className="text-4xl font-bold mb-10 tracking-tight">مرکز فرماندهی</h1>
        <div className="grid grid-cols-2 gap-4">
          {cards.map((card, i) => (
            <div
              key={i}
              onClick={() => router.push(card.href)}
              className={`bg-gradient-to-br ${card.color} border border-white/10 rounded-2xl p-7 hover:border-white/20 hover:scale-[1.02] transition-all cursor-pointer`}
            >
              <div className="text-3xl mb-4">{card.icon}</div>
              <h2 className="text-lg font-semibold mb-1">{card.title}</h2>
              <p className="text-white/40 text-sm">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
