"use client";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const cards = [
    { title: "اطلاعات اولیه", desc: "مدیریت لوگو و هویت برند", href: "/brand" },
    { title: "پرامپت‌ها", desc: "تنظیم دستورات هوش مصنوعی", href: "/prompts" },
    { title: "فرایندهای اتوماتیک", desc: "مدیریت سناریوهای خودکار", href: "/automation" },
    { title: "تحلیل و پیشنهاد", desc: "داشبوردِ آماری و خروجی‌ها", href: "/analytics" },
  ];
  return (
    <div className="p-10 bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-8">مرکز فرماندهی</h1>
      <div className="grid grid-cols-2 gap-6">
        {cards.map((card, i) => (
          <div
            key={i}
            onClick={() => router.push(card.href)}
            className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
          >
            <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
            <p className="text-gray-500">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
