"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [projectList, setProjectList] = useState(["پروژه ۱ - فروشگاه آنلاین", "پروژه ۲ - بلاگ تکنولوژی"]);
  const [selectedProject, setSelectedProject] = useState("پروژه ۱ - فروشگاه آنلاین");
  const [showInput, setShowInput] = useState(false);
  const [newName, setNewName] = useState("");

  const addProject = () => {
    if (!newName.trim()) return;
    setProjectList([...projectList, newName]);
    setSelectedProject(newName);
    setNewName("");
    setShowInput(false);
  };

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
        <h1 className="text-4xl font-bold mb-8 tracking-tight">مرکز فرماندهی</h1>

        {/* کشویی انتخاب پروژه */}
        <div className="flex items-center gap-3 mb-8">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
          >
            {projectList.map((p, i) => (
              <option key={i} value={p} className="bg-[#1a1a1a]">{p}</option>
            ))}
          </select>
          <button
            onClick={() => setShowInput(!showInput)}
            className="w-11 h-11 bg-violet-600 hover:bg-violet-500 transition-colors rounded-xl flex items-center justify-center text-xl"
          >
            +
          </button>
        </div>

        {/* اینپوت پروژه جدید */}
        {showInput && (
          <div className="flex gap-3 mb-6">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addProject()}
              placeholder="اسم پروژه جدید..."
              className="flex-1 bg-white/5 border border-violet-500/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder:text-white/20"
            />
            <button
              onClick={addProject}
              className="bg-violet-600 hover:bg-violet-500 transition-colors px-5 rounded-xl text-sm font-medium"
            >
              ایجاد
            </button>
          </div>
        )}

        {/* کارت‌ها */}
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
