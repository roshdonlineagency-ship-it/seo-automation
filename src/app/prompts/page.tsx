"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Prompt = {
  id: number;
  name: string;
  text: string;
};

function PromptsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) fetchPrompts();
  }, [projectId]);

  const fetchPrompts = async () => {
    try {
      const res = await fetch(`/api/prompts?projectId=${projectId}`);
      const data = await res.json();
      setPrompts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !text.trim()) return;
    try {
      if (editId !== null) {
        const res = await fetch('/api/prompts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, name, text }),
        });
        const updated = await res.json();
        setPrompts(prompts.map(p => p.id === editId ? updated : p));
        setEditId(null);
      } else {
        const res = await fetch('/api/prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: Number(projectId), name, text }),
        });
        const newPrompt = await res.json();
        setPrompts([newPrompt, ...prompts]);
      }
      setName("");
      setText("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (p: Prompt) => {
    setEditId(p.id);
    setName(p.name);
    setText(p.text);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/prompts?id=${id}`, { method: 'DELETE' });
      setPrompts(prompts.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = () => {
    setEditId(null);
    setName("");
    setText("");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-10" dir="rtl">
      <div className="max-w-3xl mx-auto">

        <button
          onClick={() => router.back()}
          className="text-white/40 hover:text-white text-sm mb-8 flex items-center gap-2 transition-colors"
        >
          ← برگشت
        </button>
        <p className="text-white/40 text-sm mb-1">مدیریت</p>
        <h1 className="text-4xl font-bold mb-10 tracking-tight">پرامپت‌ها</h1>

        {!projectId ? (
          <div className="text-center text-white/20 py-16 border border-white/10 rounded-2xl">
            ابتدا یک پروژه انتخاب کنید
          </div>
        ) : (
          <>
            {/* فرم */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
              <h2 className="text-sm text-white/40 mb-4">
                {editId ? "ویرایش پرامپت" : "پرامپت جدید"}
              </h2>
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="نام پرامپت..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder:text-white/20"
                />
                <textarea
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="متن پرامپت..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder:text-white/20 resize-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmit}
                    className="bg-violet-600 hover:bg-violet-500 transition-colors px-6 py-3 rounded-xl text-sm font-medium"
                  >
                    {editId ? "ذخیره تغییرات" : "ثبت پرامپت"}
                  </button>
                  {editId && (
                    <button
                      onClick={handleCancel}
                      className="bg-white/5 hover:bg-white/10 transition-colors px-6 py-3 rounded-xl text-sm font-medium"
                    >
                      انصراف
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* جدول */}
            {loading ? (
              <div className="text-center text-white/20 py-10">در حال بارگذاری...</div>
            ) : prompts.length > 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-right text-white/40 font-normal px-6 py-4">نام پرامپت</th>
                      <th className="text-right text-white/40 font-normal px-6 py-4">متن</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {prompts.map((p) => (
                      <tr
                        key={p.id}
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${editId === p.id ? "bg-violet-500/10" : ""}`}
                      >
                        <td className="px-6 py-4 font-medium whitespace-nowrap">{p.name}</td>
                        <td className="px-6 py-4 text-white/40 max-w-xs truncate">{p.text}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => handleEdit(p)}
                              className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              ویرایش
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-white/20 py-16 border border-white/10 rounded-2xl">
                هنوز پرامپتی ثبت نشده
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Prompts() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/20">در حال بارگذاری...</div>}>
      <PromptsPage />
    </Suspense>
  );
}
