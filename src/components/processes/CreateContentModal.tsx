"use client";

import { useEffect, useState } from "react";

// --- اینترفیس‌های ساختار محتوای بریف ---
interface Section {
  id: string;
  h2: string;
  content: string;
  needs_image: boolean;
  image_priority: "High" | "Medium" | "Low";
  image_suggestion: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface ArticleData {
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  slug: string;
  h1: string;
  intro: string;
  sections: Section[];
  faq: FAQ[];
  conclusion: string;
  cta: {
    text: string;
    anchor_text: string;
    target_url: string;
  };
}

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
  const [correcting, setCorrecting] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [model, setModel] = useState<'claude' | 'openai' | 'gemini' | 'groq'>('groq');
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<string>("");

  // --- استیت‌های جدید برای مدیریت ساختار بریف ---
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [approvedFields, setApprovedFields] = useState<Record<string, boolean>>({});
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [userWantsImage, setUserWantsImage] = useState<Record<string, boolean>>({});
  const [jsonError, setJsonError] = useState<string | null>(null);

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
    } bits {
      setLoading(false);
    }
  }

  const handleSubmit = () => {
    const prompt = prompts.find((p) => p.id === Number(selectedPromptId));
    if (!prompt) return;
    setSelectedPrompt(prompt);
    setStep(2);
  };

  // ترکیب پرامپت با تاکید روی خروجی JSON معتبر
  const finalPrompt = selectedPrompt
    ? `${selectedPrompt.text}\n\nموضوع:\n${topic}\n\nصفحه هدف لینک سازی:\n${targetPage}\n\nنکته فوق حیاتی: خروجی تو باید "فقط و فقط" یک فرمت JSON معتبر و منطبق بر ساختار خواسته شده باشد. هیچ کلام، تگ یا توضیحی خارج از آبجکت اصلی JSON ارسال نکن.`
    : "";

  // تولید محتوای اولیه و پارس کردن JSON خروجی
  const handleGenerate = async () => {
    setGenerating(true);
    setJsonError(null);
    setStep(3);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, model }),
      });
      const data = await res.json();
      
      // تلاش برای تمیز کردن و پارس کردن محتوای جیسان از هوش مصنوعی
      let rawContent = data.content || "";
      if (rawContent.includes("```json")) {
        rawContent = rawContent.split("```json")[1].split("```")[0].trim();
      } else if (rawContent.includes("```")) {
        rawContent = rawContent.split("```")[1].split("```")[0].trim();
      }

      const parsedData: ArticleData = JSON.parse(rawContent.trim());
      setArticleData(parsedData);
      
      // مقداردهی اولیه وضعیت تایید تصاویر هوش مصنوعی
      const imageToggles: Record<string, boolean> = {};
      parsedData.sections.forEach(sec => {
        imageToggles[sec.id] = sec.needs_image;
      });
      setUserWantsImage(imageToggles);

    } catch (error) {
      console.error(error);
      setJsonError('خطا در پردازش یا ساختار خروجی JSON هوش مصنوعی. لطفاً دوباره تلاش کنید.');
    } finally {
      setGenerating(false);
    }
  };

  // ادغام اصلاحات با دیتای قبلی و ارسال پرامپت فاز دوم (اصلاحیه)
  const handleApplyCorrections = async () => {
    if (!articleData) return;
    setCorrecting(true);
    setJsonError(null);

    // ساخت گزارش وضعیت از کارهایی که کاربر انجام داده است
    const reviewReport = {
      meta_title: approvedFields['meta_title'] ? "تایید شده (عینا تکرار شود)" : (corrections['meta_title'] || "بدون تغییر"),
      meta_description: approvedFields['meta_description'] ? "تایید شده (عینا تکرار شود)" : (corrections['meta_description'] || "بدون تغییر"),
      slug: approvedFields['slug'] ? "تایید شده (عینا تکرار شود)" : (corrections['slug'] || "بدون تغییر"),
      h1: approvedFields['h1'] ? "تایید شده (عینا تکرار شود)" : (corrections['h1'] || "بدون تغییر"),
      intro: approvedFields['intro'] ? "تایید شده (عینا تکرار شود)" : (corrections['intro'] || "بدون تغییر"),
      conclusion: approvedFields['conclusion'] ? "تایید شده (عینا تکرار شود)" : (corrections['conclusion'] || "بدون تغییر"),
      sections: articleData.sections.map(sec => ({
        id: sec.id,
        status: approvedFields[sec.id] ? "تایید شده (عینا تکرار شود)" : (corrections[sec.id] || "بدون تغییر")
      })),
      faq: articleData.faq.map((f, index) => ({
        index,
        status: approvedFields[`faq_${index}`] ? "تایید شده (عینا تکرار شود)" : (corrections[`faq_${index}`] || "بدون تغییر")
      }))
    };

    const correctionPrompt = `
تو یک سردبیر ارشد هستی. کاربر مقاله قبلی را بررسی کرده و نظرات اصلاحی ثبت کرده است.
بخش‌هایی که با عبارت "تایید شده" مشخص شده‌اند را بدون کوچک‌ترین تغییری کپی کن.
بخش‌هایی که حاوی یادداشت اصلاحی هستند را با دقت کامل بازنویسی و اصلاح کن.

دیتای فعلی مقاله:
${JSON.stringify(articleData, null, 2)}

گزارش نظرات و اصلاحات کاربر برای اعمال:
${JSON.stringify(reviewReport, null, 2)}

خروجی نهایی تو باید "فقط و فقط" ساختار کامل JSON به‌روزرسانی‌شده (منطبق با فرمت اصلی قبلی) باشد. هیچ محتوای متنی اضافی دیگری بازنگردان.
`;

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: correctionPrompt, model }),
      });
      const data = await res.json();
      
      let rawContent = data.content || "";
      if (rawContent.includes("```json")) {
        rawContent = rawContent.split("```json")[1].split("```")[0].trim();
      }

      const parsedData: ArticleData = JSON.parse(rawContent.trim());
      setArticleData(parsedData);
      
      // ریست کردن فیلدهای اصلاحیه بعد از اعمال موفق
      setCorrections({});
    } catch (error) {
      console.error(error);
      setJsonError('خطا در اعمال اصلاحات؛ فرمت خروجی نامعتبر است.');
    } finally {
      setCorrecting(false);
    }
  };

  // هردل کمکی برای تبدیل آبجکت JSON نهایی به HTML تمیز جهت ارسال به وردپرس
  const convertJsonToHtml = (data: ArticleData) => {
    let html = `<p><strong>کلمه کلیدی تمرکزی:</strong> ${data.focus_keyword}</p>`;
    html += `<p>${data.intro}</p>`;
    
    data.sections.forEach((sec) => {
      html += `<h2>${sec.h2}</h2>`;
      html += `<p>${sec.content}</p>`;
      if (userWantsImage[sec.id]) {
        html += `<p style="color: #7c3aed; font-style: italic;">[محل قرارگیری تصویر: ${sec.image_suggestion}]</p>`;
      }
    });

    if (data.faq && data.faq.length > 0) {
      html += `<h2>سوالات متداول</h2>`;
      data.faq.forEach((item) => {
        html += `<h3>${item.question}</h3>`;
        html += `<p>${item.answer}</p>`;
      });
    }

    html += `<h2>جمع‌بندی</h2><p>${data.conclusion}</p>`;
    if (data.cta) {
      html += `<div style="padding: 20px; background: #f3f4f6; border-radius: 8px; margin-top: 20px;">`;
      html += `<h4>${data.cta.text}</h4>`;
      html += `<p><a href="${data.cta.target_url}">${data.cta.anchor_text}</a></p>`;
      html += `</div>`;
    }

    return html;
  };

  const handlePublishToWordPress = async () => {
    if (!articleData) return;
    setPublishing(true);
    try {
      const formattedHtml = convertJsonToHtml(articleData);
      const res = await fetch('/api/wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: articleData.h1 || topic, content: formattedHtml }),
      });
      const data = await res.json();
      if (data.success) {
        setPublished(data.link);
      }
    } catch (error) {
      console.error(error);
    } bits {
      setPublishing(false);
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

  // کامپوننت کمکی داخلی برای رندر فیلدهای تعاملی (سکشن‌ها)
  const RenderEditableBlock = ({ 
    label, 
    fieldKey, 
    value, 
    isTextArea = false,
    extraElement = null 
  }: { 
    label: string, 
    fieldKey: string, 
    value: string, 
    isTextArea?: boolean,
    extraElement?: React.ReactNode 
  }) => (
    <div className={`p-5 rounded-2xl border transition-colors ${approvedFields[fieldKey] ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-violet-400 font-medium text-xs bg-violet-500/10 px-3 py-1 rounded-full">{label}</span>
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-white/60">
          <input 
            type="checkbox" 
            checked={!!approvedFields[fieldKey]} 
            onChange={(e) => {
              setApprovedFields(prev => ({ ...prev, [fieldKey]: e.target.checked }));
              if(e.target.checked) {
                setCorrections(prev => { const updated = {...prev}; delete updated[fieldKey]; return updated; });
              }
            }}
            className="rounded border-white/20 text-violet-600 focus:ring-violet-500 bg-transparent w-4 h-4"
          />
          تایید این بخش
        </label>
      </div>

      <div className="text-sm text-white/90 leading-7 whitespace-pre-wrap mb-4 bg-black/20 p-3 rounded-xl border border-white/5">
        {value}
      </div>

      {extraElement}

      {!approvedFields[fieldKey] && (
        <div className="mt-3">
          <input
            type="text"
            value={corrections[fieldKey] || ""}
            onChange={(e) => setCorrections(prev => ({ ...prev, [fieldKey]: e.target.value }))}
            placeholder="نیاز به اصلاحات دارد؟ نظرتان را اینجا بنویسید..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-5" dir="rtl">
      <div className="w-full max-w-4xl bg-[#111111] border border-white/10 rounded-3xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* هدر */}
        <div className="border-b border-white/10 px-6 py-5 flex items-center justify-between bg-[#111111]">
          <div>
            <p className="text-white/40 text-xs mb-1">فرایند تکاملی تولید محتوا</p>
            <h3 className="font-semibold text-white">میز تحریریه هوشمند بریف</h3>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${step >= s ? 'bg-violet-500' : 'bg-white/10'}`}
              />
            ))}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">✕</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">

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
                  <option value="" className="bg-[#1a1a1a]">انتخاب پرامپت بریف و ساختار محتوا</option>
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
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-6 py-3 rounded-xl text-sm font-medium transition-colors text-white"
              >
                بعدی ←
              </button>
            </div>
          )}

          {/* استپ ۲ — تایید و انتخاب مدل */}
          {step === 2 && (
            <div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5 space-y-3">
                <div>
                  <p className="text-white/40 text-xs mb-1">موضوع</p>
                  <p className="text-sm text-white">{topic}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">صفحه هدف لینک سازی</p>
                  <p className="text-sm text-white">{targetPage}</p>
                </div>
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
                <button onClick={() => setStep(1)} className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm hover:bg-white/10 transition-colors text-white">
                  بازگشت
                </button>
                <button onClick={handleGenerate} className="flex-1 bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl text-sm font-medium transition-colors text-white">
                  تولید بریف ساختارمند محتوا ✨
                </button>
              </div>
            </div>
          )}

          {/* استپ ۳ — میز تعاملی بررسی سکشن‌ها */}
          {step === 3 && (
            <div>
              {generating ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-6 animate-pulse">✨</div>
                  <p className="text-white/40 text-sm">در حال ساختارسازی و تدوین بریف اولیه محتوا...</p>
                </div>
              ) : jsonError ? (
                <div className="text-center py-10">
                  <p className="text-red-400 text-sm mb-4">{jsonError}</p>
                  <button onClick={() => setStep(2)} className="bg-white/5 border border-white/10 px-6 py-2 rounded-xl text-sm text-white">تلاش مجدد</button>
                </div>
              ) : articleData ? (
                <div className="space-y-6">
                  {correcting && (
                    <div className="bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs p-3 rounded-xl animate-pulse text-center">
                      در حال اعمال اصلاحات سردبیری و بازنویسی سکشن‌ها...
                    </div>
                  )}

                  {/* متادیتا */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RenderEditableBlock label="متا تایتل (SEO)" fieldKey="meta_title" value={articleData.meta_title} />
                    <RenderEditableBlock label="متا دیسکریپشن" fieldKey="meta_description" value={articleData.meta_description} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RenderEditableBlock label="کلمه کلیدی هدف" fieldKey="focus_keyword" value={articleData.focus_keyword} />
                    <RenderEditableBlock label="اسلاگ URL (Slug)" fieldKey="slug" value={articleData.slug} />
                  </div>

                  {/* ساختار محتوای اصلی */}
                  <RenderEditableBlock label="هدینگ اصلی (H1)" fieldKey="h1" value={articleData.h1} />
                  <RenderEditableBlock label="مقدمه مقاله (Intro)" fieldKey="intro" value={articleData.intro} isTextArea />

                  {/* رندر پویا و سکشن به سکشن هدینگ‌های H2 و پاراگراف‌ها */}
                  <div className="space-y-4">
                    <p className="text-white/40 text-xs border-r-2 border-violet-500 pr-2">پیکربندی سرفصل‌ها و تصاویر (H2 Sections)</p>
                    {articleData.sections?.map((sec) => (
                      <RenderEditableBlock 
                        key={sec.id}
                        label={`هدینگ دوم: ${sec.h2}`} 
                        fieldKey={sec.id} 
                        value={sec.content}
                        isTextArea
                        extraElement={
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="text-white/60">
                              <span className="text-violet-400 font-semibold">پیشنهاد هوش مصنوعی:</span> {sec.image_suggestion} 
                              <span className="mr-2 px-2 py-0.5 rounded bg-white/10 text-white/40">اولویت: {sec.image_priority}</span>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer select-none text-white/80 shrink-0">
                              <input 
                                type="checkbox"
                                checked={!!userWantsImage[sec.id]}
                                onChange={(e) => setUserWantsImage(prev => ({ ...prev, [sec.id]: e.target.checked }))}
                                className="rounded border-white/20 text-violet-600 focus:ring-violet-500 bg-transparent w-4 h-4"
                              />
                              می‌خواهم تصویر درج کنم
                            </label>
                          </div>
                        }
                      />
                    ))}
                  </div>

                  {/* سوالات متداول */}
                  {articleData.faq && articleData.faq.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-white/40 text-xs border-r-2 border-violet-500 pr-2">سوالات متداول (FAQ)</p>
                      {articleData.faq.map((item, index) => (
                        <RenderEditableBlock 
                          key={index}
                          label={`سوال متداول ${index + 1}`} 
                          fieldKey={`faq_${index}`} 
                          value={`پرسش: ${item.question}\nپاسخ: ${item.answer}`} 
                        />
                      ))}
                    </div>
                  )}

                  {/* جمع بندی و CTA */}
                  <RenderEditableBlock label="نتیجه‌گیری و جمع‌بندی" fieldKey="conclusion" value={articleData.conclusion} isTextArea />
                  
                  {articleData.cta && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-xs space-y-2">
                      <p className="text-violet-400 font-medium">پک دعوت به اقدام (CTA)</p>
                      <p className="text-white/80"><span className="text-white/40">متن:</span> {articleData.cta.text}</p>
                      <p className="text-white/80"><span className="text-white/40">انکرتکست:</span> {articleData.cta.anchor_text}</p>
                      <p className="text-white/40 truncate"><span className="text-white/40">لینک هدف:</span> {articleData.cta.target_url}</p>
                    </div>
                  )}

                  {/* بخش دکمه‌های کنترل نهایی استپ ۳ */}
                  <div className="border-t border-white/10 pt-5 flex flex-wrap gap-3">
                    <button 
                      onClick={handleApplyCorrections}
                      disabled={correcting || Object.keys(corrections).length === 0}
                      className="bg-amber-600 hover:bg-amber-500 disabled:opacity-30 px-5 py-3 rounded-xl text-sm font-medium transition-colors text-white flex-1 min-w-[150px]"
                    >
                      {correcting ? 'در حال اعمال اصلاحیه...' : '🛠️ اعمال نظرات و اصلاحیه'}
                    </button>

                    {published ? (
                      <a
                        href={published}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-500 px-5 py-3 rounded-xl text-sm font-medium transition-colors text-center text-white flex-1 min-w-[150px]"
                      >
                        ✅ مشاهده در وردپرس
                      </a>
                    ) : (
                      <button
                        onClick={handlePublishToWordPress}
                        disabled={publishing || correcting}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-5 py-3 rounded-xl text-sm font-medium transition-colors text-white flex-1 min-w-[150px]"
                      >
                        {publishing ? 'در حال انتشار...' : '📤 تایید نهایی و ارسال به وردپرس'}
                      </button>
                    )}

                    <button
                      onClick={handleGenerateImage}
                      disabled={correcting}
                      className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl text-sm font-medium transition-colors text-white"
                    >
                      🎨 ساخت تصویر شاخص
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* استپ ۴ — تصویر */}
          {step === 4 && (
            <div>
              {generatingImage ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-6 animate-pulse">🎨</div>
                  <p className="text-white/40 text-sm">در حال ساخت تصویر با هوش مصنوعی...</p>
                </div>
              ) : imageUrl.startsWith('error:') ? (
                <div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-5 text-red-400 text-sm">
                    {imageUrl.replace('error:', '')}
                  </div>
                  <button onClick={() => setStep(3)} className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm hover:bg-white/10 transition-colors text-white">
                    بازگشت به میز تحریریه
                  </button>
                </div>
              ) : (
                <div>
                  <div className="rounded-2xl overflow-hidden mb-5 border border-white/10 max-h-[400px]">
                    <img src={imageUrl} alt={topic} className="w-full object-cover" />
                  </div>
                  <p className="text-white/40 text-xs mb-5 text-center">موضوع تصویر: {topic}</p>
                  <div className="flex gap-3">
                    <button onClick={() => setStep(3)} className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm hover:bg-white/10 transition-colors text-white">
                      بازگشت به بریف
                    </button>
                    <button onClick={() => window.open(imageUrl, '_blank')} className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm hover:bg-white/10 transition-colors text-white">
                      دانلود تصویر
                    </button>
                    <button onClick={onClose} className="flex-1 bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl text-sm font-medium transition-colors text-white">
                      تایید و بستن مودال ✓
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
