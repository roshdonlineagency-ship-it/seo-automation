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
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [result, setResult] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [model, setModel] = useState<'claude' | 'openai' | 'gemini' | 'groq'>('groq');

  useEffect(() => {
    if (!projectId) return;
    loadPrompts();
  }, [projectId]);

  async function loadPrompts() {
    try {
      setLoading(true);
      const res = await fetch(`/api/prompts?projectId=${Number(projectId)}`);
      const data = await res.json();
      if (Array.isArray(data)) setPrompts(data);
    } catch (error) {
      console.error(error);
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

  const handleGenerate = async () => {
    setGenerating(true);
    setStep(3);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, model }),
      });
      const data = await res.json();
      setResult(data.content || data.error);
    } catch (error) {
      setResult('خطا در تولید محتوا');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    setGeneratingImage(true);
    setStep(4);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: topic }),
      });
      const data = await res.json();
      setImageUrl(data.url || '');
      if (data.error) setImageUrl('error:' + data.error);
    } catch (error) {
      setImageUrl('error:خطا در تولید تصویر');
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-5">
      <div className="w-full max-w-4xl bg-[#111111] border border-white/10 rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* هدر */}
        <div className="border-b border-white/10 px-6 py-5 flex items-center justify-between sticky top-0 bg-[#111111] z-10">
          <div>
            <p className="text-white/40 text-xs mb-1">فرایند</p>
            <h3 className="font-semibold">درج محتوا</h3>
          </div>
          {/* استپ اندیکاتور */}
          <div className="flex items-center gap-2">
            {[1,2,3,4].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${step >= s ? 'bg-violet-500' : 'bg-white/10'}`}
              />
            ))}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">✕</button>
        </div>

        <div className="p-6">

          {/* استپ ۱ — ورودی‌ها */}
          {step === 1 && (
            <div className="space-y-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="موضوع محتوا..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-white/20"
              />
              <input
                type="text"
                value={targetPage}
                onChange={(e) => setTargetPage(e.target.value)}
                placeholder="صفحه تارگت لینک سازی..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-white/20"
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
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
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-6 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                بعدی ←
              </button>
            </div>
          )}

          {/* استپ ۲ — تایید و انتخاب مدل */}
          {step === 2 && (
            <div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
                <div className="mb-4">
                  <p className="text-white/40 text-xs mb-1">موضوع</p>
                  <p className="text-sm">{topic}</p>
                </div>
                <div className="mb-4">
                  <p className="text-white/40 text-xs mb-1">صفحه هدف لینک سازی</p>
                  <p className="text-sm">{targetPage}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">پرامپت انتخابی</p>
                  <p className="text-sm">{selectedPrompt?.name}</p>
                </div>
              </div>

              <div className="bg-black/30 border border-white/10 rounded-2xl p-5 mb-5">
                <p className="text-white/40 text-xs mb-3">پرامپت نهایی</p>
                <pre className="whitespace-pre-wrap text-sm leading-7 text-white/80">{finalPrompt}</pre>
              </div>

              <p className="text-white/40 text-xs mb-3">انتخاب مدل هوش مصنوعی</p>
              <div className="flex gap-3 mb-5">
                {[
                  { id: 'groq', label: '⚡ Groq' },
                  { id: 'gemini', label: '✨ Gemini' },
                  { id: 'claude', label: '🤖 Claude' },
                  { id: 'openai', label: '💬 OpenAI' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id as any)}
                    className={`flex-1 py-3 rounded-xl text-sm border transition-colors ${model === m.id ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm hover:bg-white/10 transition-colors">
                  بازگشت
                </button>
                <button onClick={handleGenerate} className="flex-1 bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl text-sm font-medium transition-colors">
                  تولید محتوا ✨
                </button>
              </div>
            </div>
          )}

          {/* استپ ۳ — نتیجه محتوا */}
          {step === 3 && (
            <div>
              {generating ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-6 animate-pulse">✨</div>
                  <p className="text-white/40 text-sm">در حال تولید محتوا...</p>
                </div>
              ) : (
                <div>
                  <div className="bg-black/30 border border-white/10 rounded-2xl p-5 mb-5">
                    <p className="text-white/40 text-xs mb-3">محتوای تولید شده</p>
                    <pre className="whitespace-pre-wrap text-sm leading-7 text-white/90">{result}</pre>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm hover:bg-white/10 transition-colors">
                      بازگشت
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(result)}
                      className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm hover:bg-white/10 transition-colors"
                    >
                      📋 کپی
                    </button>
                    <button
                      onClick={handleGenerateImage}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl text-sm font-medium transition-colors"
                    >
                      🎨 ساخت تصویر
                    </button>
                    <button onClick={onClose} className="bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl text-sm font-medium transition-colors">
                      تایید ✓
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* استپ ۴ — تصویر */}
          {step === 4 && (
            <div>
              {generatingImage ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-6 animate-pulse">🎨</div>
                  <p className="text-white/40 text-sm">در حال ساخت تصویر...</p>
                  <p className="text-white/20 text-xs mt-2">این ممکنه چند ثانیه طول بکشه</p>
                </div>
              ) : imageUrl.startsWith('error:') ? (
                <div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-5 text-red-400 text-sm">
                    {imageUrl.replace('error:', '')}
                  </div>
                  <button onClick={() => setStep(3)} className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm hover:bg-white/10 transition-colors">
                    بازگشت
                  </button>
                </div>
              ) : (
                <div>
                  <div className="rounded-2xl overflow-hidden mb-5 border border-white/10">
                    <img src={imageUrl} alt={topic} className="w-full object-cover" />
                  </div>
                  <p className="text-white/40 text-xs mb-5 text-center">موضوع: {topic}</p>
                  <div className="flex gap-3">
                    <button onClick={() => setStep(3)} className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm hover:bg-white/10 transition-colors">
                      بازگشت
                    </button>
                    
                      href={imageUrl}
                      download="image.webp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm hover:bg-white/10 transition-colors"
                    >
                      ⬇️ دانلود
                    </a>
                    <button onClick={onClose} className="flex-1 bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl text-sm font-medium transition-colors">
                      تایید و بستن ✓
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
