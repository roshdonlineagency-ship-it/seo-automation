"use client";

import { useEffect, useState } from "react";

interface Prompt {
  id: number;
  name: string;
  text: string;
}

interface Props {
  projectId: number;
  onClose: () => void;
}

export default function CreateContentModal({ projectId, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState("");
  const [targetPage, setTargetPage] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    loadPrompts();
  }, [projectId]);

  async function loadPrompts() {
    try {
      setLoading(true);
      const id = Number(projectId);
      console.log("fetching prompts for projectId:", id);
      const res = await fetch(`/api/prompts?projectId=${id}`);
      const data = await res.json();
      console.log("prompts response:", data);
      if (Array.isArray(data)) {
        setPrompts(data);
      } else {
        console.error("unexpected response:", data);
      }
    } catch (error) {
      console.error("error loading prompts:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = () => {
    const prompt = prompts.find((p) => p.id === Number(selectedPromptId));
    if (!prompt) return;
    setSelectedPrompt(prompt);
    setStep(2);
  };

  const finalPrompt = selectedPrompt
    ? `${selectedPrompt.text}\n\nموضوع:\n${topic}\n\nصفحه هدف لینک سازی:\n${targetPage}`
    : "";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-5">
      <div className="w-full max-w-4xl bg-[#111111] border border-white/10 rounded-3xl overflow-hidden">

        <div className="border-b border-white/10 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-white/40 text-xs mb-1">فرایند</p>
            <h3 className="font-semibold">درج محتوا</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="موضوع محتوا..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500"
              />
              <input
                type="text"
                value={targetPage}
                onChange={(e) => setTargetPage(e.target.value)}
                placeholder="صفحه تارگت لینک سازی..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500"
              />

              {loading ? (
                <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/20">
                  در حال بارگذاری پرامپت‌ها...
                </div>
              ) : prompts.length === 0 ? (
                <div className="w-full bg-white/5 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                  هیچ پرامپتی برای این پروژه ثبت نشده
                </div>
              ) : (
                <select
                  value={selectedPromptId}
                  onChange={(e) => setSelectedPromptId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="" className="bg-[#1a1a1a]">انتخاب پرامپت</option>
                  {prompts.map((prompt) => (
                    <option key={prompt.id} value={prompt.id} className="bg-[#1a1a1a]">
                      {prompt.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={handleSubmit}
                disabled={!topic || !targetPage || !selectedPromptId}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-6 py-3 rounded-xl text-sm font-medium"
              >
                ثبت
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
                <div className="mb-5">
                  <p className="text-white/40 text-xs mb-1">موضوع</p>
                  <p>{topic}</p>
                </div>
                <div className="mb-5">
                  <p className="text-white/40 text-xs mb-1">صفحه هدف لینک سازی</p>
                  <p>{targetPage}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">پرامپت انتخابی</p>
                  <p>{selectedPrompt?.name}</p>
                </div>
              </div>

              <div className="bg-black/30 border border-white/10 rounded-2xl p-5">
                <p className="text-white/40 text-xs mb-3">پرامپت نهایی</p>
                <pre className="whitespace-pre-wrap text-sm leading-7">{finalPrompt}</pre>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm"
                >
                  بازگشت
                </button>
                <button
                  onClick={onClose}
                  className="bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl text-sm"
                >
                  تایید نهایی
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
