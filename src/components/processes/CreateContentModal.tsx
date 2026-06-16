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
  
  // استیت انتخاب دو پرامپت مجزا
  const [selectedGenPromptId, setSelectedGenPromptId] = useState("");
  const [selectedRevPromptId, setSelectedRevPromptId] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<string>("");

  // استیت‌های مدیریت محتوای متنی پیست شده و تولید شده
  const [pastedJson, setPastedJson] = useState("");
  const [correctionPastedJson, setCorrectionPastedJson] = useState("");
  const [compiledCorrectionPrompt, setCompiledCorrectionPrompt] = useState("");
  const [isWaitingForCorrection, setIsWaitingForCorrection] = useState(false);

  // --- استیت‌های مدیریت ساختار بریف ---
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
    } finally {
      setLoading(false);
    }
  }

  // تمیزکننده بلاک‌های کد مارک‌داون
  const cleanAndParseJson = (rawContent: string) => {
    let clean = rawContent.trim();
    if (clean.includes("```json")) {
      clean = clean.split("```json")[1].split("```")[0].trim();
    } else if (clean.includes("```")) {
      clean = clean.split("```")[1].split("```")[0].trim();
    }
    return JSON.parse(clean);
  };

  // مرحله ۱: ادغام اطلاعات با پرامپت تولید اولیه
  const getFinalGenerationPrompt = () => {
    const genPrompt = prompts.find((p) => p.id === Number(selectedGenPromptId));
    if (!genPrompt) return "";
    return `${genPrompt.text}\n\nموضوع مقاله:\n${topic}\n\nصفحه هدف برای لینک سازی:\n${targetPage}\n\nنکته فوق حیاتی: خروجی تو باید "فقط و فقط" یک فرمت JSON معتبر و منطبق بر ساختار خواسته شده باشد. هیچ کلام، تگ یا توضیحی خارج از آبجکت اصلی JSON ارسال نکن.`;
  };

  // پردازش جیسان اولیه وارد شده توسط کاربر
  const handleParseInitialJson = () => {
    setJsonError(null);
    try {
      const parsedData = cleanAndParseJson(pastedJson);
      setArticleData(parsedData);
      
      const imageToggles: Record<string, boolean> = {};
      parsedData.sections?.forEach((sec: any) => {
        imageToggles[sec.id] = sec.needs_image;
      });
      setUserWantsImage(imageToggles);
      
      setStep(3); 
    } catch (error) {
      console.error(error);
      setJsonError("خطا در ساختار JSON! مطمئن شوید که تمام متن ساختار معتبر دارد.");
    }
  };

  // مرحله ۳: ساخت پرامپت اصلاحیه برای کپی دستی کاربر
  const handleGenerateCorrectionPrompt = () => {
    if (!articleData) return;
    const revPrompt = prompts.find((p) => p.id === Number(selectedRevPromptId));
    if (!revPrompt) {
      alert("لطفا ابتدا پرامپت اصلاحیه را از تنظیمات مرحله اول انتخاب کنید.");
      return;
    }

    const reviewReport = {
      meta_title: approvedFields["meta_title"] ? "تایید شده (عینا تکرار شود)" : (corrections["meta_title"] || "بدون تغییر"),
      meta_description: approvedFields["meta_description"] ? "تایید شده (عینا تکرار شود)" : (corrections["meta_description"] || "بدون تغییر"),
      slug: approvedFields["slug"] ? "تایید شده (عینا تکرار شود)" : (corrections["slug"] || "بدون تغییر"),
      h1: approvedFields["h1"] ? "تایید شده (عینا تکرار شود)" : (corrections["h1"] || "بدون تغییر"),
      intro: approvedFields["intro"] ? "تایید شده (عینا تکرار شود)" : (corrections["intro"] || "بدون تغییر"),
      conclusion: approvedFields["conclusion"] ? "تایید شده (عینا تکرار شود)" : (corrections["conclusion"] || "بدون تغییر"),
      sections: articleData.sections?.map(sec => ({
        id: sec.id,
        status: approvedFields[sec.id] ? "تایید شده (عینا تکرار شود)" : (corrections[sec.id] || "بدون تغییر")
      })),
      faq: articleData.faq?.map((f, index) => ({
        index,
        status: approvedFields[`faq_${index}`] ? "تایید شده (عینا تکرار شود)" : (corrections[`faq_${index}`] || "بدون تغییر")
      }))
    };

    const finalCorrectionText = `
${revPrompt.text}

دیتای فعلی مقاله (فرمت JSON):
${JSON.stringify(articleData, null, 2)}

گزارش نظرات، تاییدها و اصلاحات کاربر برای اعمال:
${JSON.stringify(reviewReport, null, 2)}

نکته فوق حیاتی: خروجی نهایی تو باید "فقط و فقط" ساختار کامل و به‌روزرسانی‌شده ی JSON قبلی باشد. هیچ توضیح یا مقدمه و موخره‌ای خارج از ساختار JSON ننویس.
`;

    setCompiledCorrectionPrompt(finalCorrectionText.trim());
    setIsWaitingForCorrection(true);
  };

  // اعمال جیسان اصلاح شده دستی کاربر
  const handleApplyCorrectionJson = () => {
    setJsonError(null);
    try {
      const parsedData = cleanAndParseJson(correctionPastedJson);
      setArticleData(parsedData);
      
      setCorrections({});
      setCorrectionPastedJson("");
      setIsWaitingForCorrection(false);
    } catch (error) {
      console.error(error);
      setJsonError("ساختار JSON اصلاحیه نامعتبر است.");
    }
  };

  // تبدیل دیتای نهایی به HTML
  const convertJsonToHtml = (data: ArticleData) => {
    let html = `<p><strong>کلمه کلیدی تمرکزی:</strong> ${data.focus_keyword}</p>`;
    html += `<p>${data.intro}</p>`;
    
    data.sections?.forEach((sec) => {
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
      const res = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: articleData.h1 || topic, content: formattedHtml }),
      });
      const data = await res.json();
      if (data.success) {
        setPublished(data.link);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setPublishing(false);
    }
  };

  // کامپوننت کمکی داخلی اصلاح شده با تایپ اختیاری extraElement
  const RenderEditableBlock = ({ 
    label, 
    fieldKey, 
    value,
    extraElement
  }: { 
    label: string, 
    fieldKey: string, 
    value: string,
    extraElement?: React.ReactNode
  }) => (
    <div className={`p-5 rounded-2xl border transition-colors ${approvedFields[fieldKey] ? "bg-emerald-500/5 border-emerald-500/30" : "bg-white/5 border-white/10"}`}>
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

      {/* نمایش المان تصویر یا موارد اضافه در صورت وجود */}
      {extraElement && <div className="mb-4">{extraElement}</div>}

      {!approvedFields[fieldKey] && (
        <div className="mt-3">
          <input
            type="text"
            value={corrections[fieldKey] || ""}
            onChange={(e) => setCorrections(prev => ({ ...prev, [fieldKey]: e.target.value }))}
            placeholder="یادداشت اصلاحی برای این بخش..."
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
        <div className="border-b border-white/10 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-white/40 text-xs mb-1">میز تحریریه دستی و مستقل هوش مصنوعی</p>
            <h3 className="font-semibold text-white">مدیریت و تدوین ساختار بریف مقاله</h3>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`w-2 h-2 rounded-full transition-colors ${step >= s ? "bg-violet-500" : "bg-white/10"}`} />
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
                placeholder="موضوع محتوا چیست؟"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500"
              />
              <input
                type="text"
                value={targetPage}
                onChange={(e) => setTargetPage(e.target.value)}
                placeholder="صفحه/لینک تارگت هدف برای ساخت بک‌لینک و CTA..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500"
              />
              
              {loading ? (
                <div className="text-sm text-white/30 animate-pulse">در حال فراخوانی پرامپت‌های پروژه...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/40 text-xs mb-2">پرامپت تولید اولیه مقاله:</label>
                    <select
                      value={selectedGenPromptId}
                      onChange={(e) => setSelectedGenPromptId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="" className="bg-[#1a1a1a]">انتخاب پرامپت تولید</option>
                      {prompts.map((p) => <option key={p.id} value={p.id} className="bg-[#1a1a1a]">{p.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/40 text-xs mb-2">پرامپت بازنویسی / اصلاحیه:</label>
                    <select
                      value={selectedRevPromptId}
                      onChange={(e) => setSelectedRevPromptId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="" className="bg-[#1a1a1a]">انتخاب پرامپت اصلاحیه</option>
                      {prompts.map((p) => <option key={p.id} value={p.id} className="bg-[#1a1a1a]">{p.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!topic || !targetPage || !selectedGenPromptId || !selectedRevPromptId}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-6 py-3 rounded-xl text-sm font-medium transition-colors text-white mt-2"
              >
                ساخت پرامپت اولیه محتوا ←
              </button>
            </div>
          )}

          {/* استپ ۲ — کپی پرامپت و ورود جیسان */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <p className="text-amber-400 text-xs mb-2 font-medium">۱. متن زیر را کپی کنید و در چت‌بات هوش مصنوعی خود اجرا کنید:</p>
                <div className="relative">
                  <textarea
                    readOnly
                    value={getFinalGenerationPrompt()}
                    className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white/80 leading-6 font-mono focus:outline-none"
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(getFinalGenerationPrompt());
                      alert("پرامپت با موفقیت کپی شد!");
                    }}
                    className="absolute bottom-4 left-4 bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-lg border border-white/10"
                  >
                    📋 کپی کل پرامپت
                  </button>
                </div>
              </div>

              <div>
                <p className="text-emerald-400 text-xs mb-2 font-medium">۲. خروجی مقاله JSON دریافتی را کپی کرده و در کادر زیر قرار دهید:</p>
                <textarea
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder="آبجکت JSON تولیدی را اینجا وارد کنید..."
                  className="w-full h-44 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              {jsonError && <p className="text-red-400 text-xs">{jsonError}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm text-white">بازگشت</button>
                <button 
                  onClick={handleParseInitialJson}
                  disabled={!pastedJson}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl text-sm font-medium text-white disabled:opacity-40"
                >
                  پارس اطلاعات و ورود به میز تحریریه 🧠
                </button>
              </div>
            </div>
          )}

          {/* استپ ۳ — میز تحریریه */}
          {step === 3 && articleData && (
            <div className="space-y-6">

              {isWaitingForCorrection && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-amber-400 text-xs font-semibold">🛠️ پرامپت اصلاحیه ساخته شد! کپی کنید و به هوش مصنوعی تحویل دهید:</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(compiledCorrectionPrompt);
                        alert("پرامپت اصلاحیه کپی شد!");
                      }}
                      className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-3 py-1 rounded-lg"
                    >
                      📋 کپی پرامپت اصلاحیه
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={compiledCorrectionPrompt}
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white/70 font-mono focus:outline-none"
                  />
                  <div>
                    <p className="text-emerald-400 text-xs font-semibold mb-2">📥 حالا خروجی JSON اصلاح‌شده را در کادر زیر پیست کنید:</p>
                    <textarea
                      value={correctionPastedJson}
                      onChange={(e) => setCorrectionPastedJson(e.target.value)}
                      placeholder="متن کامل آبجکت JSON جدید..."
                      className="w-full h-32 bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setIsWaitingForCorrection(false)} className="text-white/40 hover:text-white text-xs px-4 py-2 rounded-xl">انصراف</button>
                    <button 
                      onClick={handleApplyCorrectionJson}
                      disabled={!correctionPastedJson}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-5 py-2 rounded-xl font-medium"
                    >
                      🔄 بروزرسانی میز تحریریه
                    </button>
                  </div>
                </div>
              )}

              {jsonError && <p className="text-red-400 text-xs bg-red-500/10 p-3 rounded-xl border border-red-500/20">{jsonError}</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RenderEditableBlock label="متا تایتل (SEO)" fieldKey="meta_title" value={articleData.meta_title} />
                <RenderEditableBlock label="متا دیسکریپشن" fieldKey="meta_description" value={articleData.meta_description} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RenderEditableBlock label="کلمه کلیدی هدف" fieldKey="focus_keyword" value={articleData.focus_keyword} />
                <RenderEditableBlock label="اسلاگ URL (Slug)" fieldKey="slug" value={articleData.slug} />
              </div>

              <RenderEditableBlock label="هدینگ اصلی (H1)" fieldKey="h1" value={articleData.h1} />
              <RenderEditableBlock label="مقدمه مقاله (Intro)" fieldKey="intro" value={articleData.intro} />

              <div className="space-y-4">
                <p className="text-white/40 text-xs border-r-2 border-violet-500 pr-2">پیکربندی سرفصل‌ها و موقعیت تصاویر</p>
                {articleData.sections?.map((sec) => (
                  <RenderEditableBlock 
                    key={sec.id}
                    label={`هدینگ دوم: ${sec.h2}`} 
                    fieldKey={sec.id} 
                    value={sec.content}
                    extraElement={
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="text-white/60">
                          <span className="text-violet-400 font-semibold">ایده تصویر:</span> {sec.image_suggestion} 
                          <span className="mr-2 px-2 py-0.5 rounded bg-white/10 text-white/40">اولویت: {sec.image_priority}</span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer select-none text-white/80 shrink-0">
                          <input 
                            type="checkbox"
                            checked={!!userWantsImage[sec.id]}
                            onChange={(e) => setUserWantsImage(prev => ({ ...prev, [sec.id]: e.target.checked }))}
                            className="rounded border-white/20 text-violet-600 focus:ring-violet-500 bg-transparent w-4 h-4"
                          />
                          تایید درج تصویر در این بخش
                        </label>
                      </div>
                    }
                  />
                ))}
              </div>

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

              <RenderEditableBlock label="نتیجه‌گیری مقاله" fieldKey="conclusion" value={articleData.conclusion} />
              
              {articleData.cta && (
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-xs space-y-2">
                  <p className="text-violet-400 font-medium">پک دعوت به اقدام (CTA)</p>
                  <p className="text-white/80"><span className="text-white/40">متن نمایش:</span> {articleData.cta.text}</p>
                  <p className="text-white/80"><span className="text-white/40">انکرتکست:</span> {articleData.cta.anchor_text}</p>
                  <p className="text-white/40 truncate"><span className="text-white/40">لینک هدف:</span> {articleData.cta.target_url}</p>
                </div>
              )}

              <div className="border-t border-white/10 pt-5 flex flex-wrap gap-3">
                <button 
                  onClick={handleGenerateCorrectionPrompt}
                  className="bg-amber-600 hover:bg-amber-500 px-5 py-3 rounded-xl text-sm font-medium text-white flex-1 min-w-[180px]"
                >
                  ⚙️ ساخت پرامپت اصلاحیه سردبیری
                </button>

                {published ? (
                  <a
                    href={published}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 px-5 py-3 rounded-xl text-sm font-medium text-center text-white flex-1 min-w-[180px]"
                  >
                    ✅ مشاهده مقاله درج شده در وردپرس
                  </a>
                ) : (
                  <button
                    onClick={handlePublishToWordPress}
                    disabled={publishing}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-5 py-3 rounded-xl text-sm font-medium text-white flex-1 min-w-[180px]"
                  >
                    {publishing ? "در حال ارسال به وردپرس..." : "📤 تایید نهایی و ارسال مستقیم به وردپرس"}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
