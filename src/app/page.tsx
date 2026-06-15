"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Project = {
  id: number;
  name: string;
  url: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(true);

  const cards = [
    { icon: "🏢", title: "اطلاعات اولیه", desc: "مدیریت لوگو و هویت برند", color: "from-violet-500/20 to-violet-500/5", href: "/brand" },
    { icon: "⚡", title: "پرامپت‌ها", desc: "تنظیم دستورات هوش مصنوعی", color: "from-blue-500/20 to-blue-500/5", href: "/prompts" },
    { icon: "🤖", title: "فرایندهای اتوماتیک", desc: "مدیریت سناریوهای خودکار", color: "from-emerald-500/20 to-emerald-500/5", href: "/automation" },
    { icon: "📊", title: "تحلیل و پیشنهاد", desc: "داشبورد آماری و خروجی‌ها", color: "from-amber-500/20 to-amber-500/5", href: "/analytics" },
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
      if (data.length > 0) setSelectedProject(data[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addProject = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, url: newUrl }),
      });
      const project = await res.json();
      setProjects([project, ...projects]);
      setSelectedProject(project);
      setNewName("");
      setNewUrl("");
      setShowInput(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-10" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <p className="text-white/40 text-sm mb-1">خوش اومدی 👋</p>
        <h1 className="text-4xl font-bold mb-8 tracking-tight">مرکز فرماندهی</h1>

        {/* کشویی انتخاب پروژه */}
        <div className="flex items-center gap-3 mb-4">
          {loading ? (
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/20 text-sm">
              در حال بارگذاری...
            </div>
          ) : (
            <select
              value={selectedProject?.id || ""}
              onChange={(e) => {
                const p = projects.find(p => p.id === Number(e.target.value));
                if (p) setSelectedProject(p);
              }}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
            >
              {projects.length === 0 && (
                <option value="" className="bg-[#1a1a1a]">هنوز پروژه‌ای ندارید</option>
              )}
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#1a1a1a]">{p.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowInput(!showInput)}
            className="w-11 h-11 bg-violet-600 hover:bg-violet-500 transition-colors rounded-xl flex items-center justify-center text-xl"
          >
            +
          </button>
        </div>

        {/* فرم پروژه جدید */}
        {showInput && (
          <div className="bg-white/5 border border-violet-500/30 rounded-xl p-4 mb-6 flex flex-col gap-3">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="نام پروژه..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder:text-white/20"
            />
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addProject()}
              placeholder="آدرس سایت (اختیاری)..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder:text-white/20"
            />
            <div className="flex gap-3">
              <button
                onClick={addProject}
                className="bg-violet-600 hover:bg-violet-500 transition-colors px-5 py-2.5 rounded-xl text-sm font-medium"
              >
                ثبت پروژه
              </button>
              <button
                onClick={() => setShowInput(false)}
                className="bg-white/5 hover:bg-white/10 transition-colors px-5 py-2.5 rounded-xl text-sm"
              >
                انصراف
              </button>
            </div>
          </div>
        )}

        {/* کارت‌ها */}
        <div className="grid grid-cols-2 gap-4">
          {cards.map((card, i) => (
            <div
              key={i}
              onClick={() => selectedProject && router.push(`${card.href}?projectId=${selectedProject.id}`)}
              className={`bg-gradient-to-br ${card.color} border border-white/10 rounded-2xl p-7 hover:border-white/20 hover:scale-[1.02] transition-all cursor-pointer ${!selectedProject ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <div className="text-3xl mb-4">{card.icon}</div>
              <h2 className="text-lg font-semibold mb-1">{card.title}</h2>
              <p className="text-white/40 text-sm">{card.desc}</p>
            </div>
          ))}
        </div>

        {!selectedProject && !loading && (
          <p className="text-center text-white/20 text-sm mt-6">ابتدا یک پروژه بسازید</p>
        )}
      </div>
    </div>
  );
}
