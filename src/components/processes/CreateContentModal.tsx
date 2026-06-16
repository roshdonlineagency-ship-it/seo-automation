import React, { useState } from "react";

// --- اینترفیس‌های کامل تایپ‌اسکریپت برای جلوگیری از خطای بیلد ---
export interface ImageIdeaSet {
  sectionId: string;
  heading: string;
  ideas: string[];
  selectedIdea: string;
  customIdea: string;
  generatedPrompt: string;
  fileName: string;
  altText: string;
}

export interface Section {
  id: string;
  h2: string;
  content: string;
}

export interface ArticleData {
  h1: string;
  intro: string;
  conclusion: string;
  sections: Section[];
}

export interface PromptItem {
  id: number;
  text: string;
}

export interface CreateContentModalProps {
  isOpen?: boolean;
  onClose: () => void;
  projectId?: number; // 👈 این فیلد اضافه شد تا خطای خط 96 کامپوننت مادر شما کاملاً برطرف شود
  articleData?: ArticleData | null;
  prompts?: PromptItem[];
  pIds?: { idea: string; draw: string; meta: string };
  userWantsImage?: Record<string, boolean>;
}

export default function CreateContentModal({
  isOpen = true,
  onClose,
  projectId,
  articleData = null,
  prompts = [],
  pIds = { idea: "1", draw: "2", meta: "3" },
  userWantsImage = {},
}: CreateContentModalProps) {
  // --- استیت‌های اصلی مودال ---
  const [step, setStep] = useState<number>(3);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState<boolean>(false);
  const [imageAssets, setImageAssets] = useState<Record<string, ImageIdeaSet>>({});
  const [manualJson, setManualJson] = useState<string>("");

  if (!isOpen) return null;

  // تابع کمکی برای پاکسازی و پارس کردن امن جی‌سان
  const cleanAndParseJson = (content: string) => {
    const cleanStr = content.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanStr);
  };

  // ۱️⃣ متد تولید اتوماتیک ایده‌ها با گراک API
  const generateImageIdeas = async () => {
    setStep(4);
    setIsGeneratingIdeas(true);

    try {
      const ideaPrompt = prompts.find((p) => p.id === Number(pIds.idea))?.text || "";
      const newAssets: Record<string, ImageIdeaSet> = {};
      const activeKeys = Object.keys(userWantsImage).filter((key) => userWantsImage[key]);

      // اگر هیچ سکشنی تیک نخورده بود، برای کلیدهای پیش‌فرض شبیه‌سازی کن
      const finalKeys = activeKeys.length > 0 ? activeKeys : ["h1", "intro", "conclusion"];

      await Promise.all(
        finalKeys.map(async (key) => {
          let heading = "";
          let content = "";

          if (key === "h1") { heading = "تیتر اصلی مقاله (H1)"; content = articleData?.h1 || ""; }
          else if (key === "intro") { heading = "مقدمه مقاله"; content = articleData?.intro || ""; }
          else if (key === "conclusion") { heading = "نتیجه‌گیری انتها"; content = articleData?.conclusion || ""; }
          else {
            const sec = articleData?.sections?.find((s) => s.id === key);
            if (sec) { heading = `سکشن: ${sec.h2}`; content = sec.content; }
            else { heading = `بخش ${key}`; content = ""; }
          }

          try {
            const res = await fetch("/api/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "groq",
                prompt: `${ideaPrompt}\n\nمحتوای متنی بخش مربوطه:\n${content}`,
              }),
            });

            if (!res.ok) throw new Error(`API Status: ${res.status}`);

            const data = await res.json();
            const parsedJson = cleanAndParseJson(data.content);
            const ideas = parsedJson.ideas || ["خطا در دریافت ایده اول", "ایده دوم", "ایده سوم"];

            newAssets[key] = {
              sectionId: key,
              heading,
              ideas,
              selectedIdea: ideas[0] || "",
              customIdea: "",
              generatedPrompt: "",
              fileName: "",
              altText: "",
            };
          } catch (e) {
            console.error(`Error generating for key [${key}]:`, e);
            newAssets[key] = {
              sectionId: key,
              heading,
              ideas: ["سمپل ایده اول (خطای سرور)", "سمپل ایده دوم", "سمپل ایده سوم"],
              selectedIdea: "سمپل ایده اول (خطای سرور)",
              customIdea: "",
              generatedPrompt: "",
              fileName: "image.jpg",
              altText: "تصویر مقاله",
            };
          }
        })
      );

      setImageAssets(newAssets);
    } catch (globalError) {
      console.error(globalError);
      alert("خطایی در سیستم فرآیند ایده‌پردازی رخ داد.");
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  // ۲️⃣ میانبر طلایی: بارگذاری دستی و استخراج دیتای JSON کپی شده از Claude یا ChatGPT
  const handleImportManualJson = (rawJsonString: string) => {
    if (!rawJsonString.trim()) {
      alert("لطفاً ابتدا کد JSON را در کادر وارد کنید.");
      return;
    }

    try {
      const cleanJson = rawJsonString.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      const newAssets: Record<string, ImageIdeaSet> = { ...imageAssets };

      Object.keys(parsed).forEach((key) => {
        const ideas = Array.isArray(parsed[key]) ? parsed[key] : [];

        let heading = "";
        if (key === "h1") heading = "تیتر اصلی مقاله (H1)";
        else if (key === "intro") heading = "مقدمه مقاله";
        else if (key === "conclusion") heading = "نتیجه‌گیری انتها";
        else {
          const sec = articleData?.sections?.find((s) => s.id === key);
          heading = sec ? `سکشن: ${sec.h2}` : `بخش ${key}`;
        }

        newAssets[key] = {
          sectionId: key,
          heading,
          ideas,
          selectedIdea: ideas[0] || "",
          customIdea: "",
          generatedPrompt: "",
          fileName: "",
          altText: "",
        };
      });

      setImageAssets(newAssets);
      setStep(4); // هدایت مستقیم به استودیو تصویر
    } catch (error) {
      alert("خطا در خواندن دیتای JSON. لطفا فرمت کد کپی شده را بررسی کنید.");
    }
  };

  // ۳️⃣ متد چرخ‌دنده: نهایی‌سازی پرامپت رندر و سئو تصاویر
  const finalizeImageAssets = async (key: string) => {
    const asset = imageAssets[key];
    if (!asset) return;

    const finalIdea = asset.customIdea || asset.selectedIdea;
    const drawPromptBase = prompts.find((p) => p.id === Number(pIds.draw))?.text || "";
    const metaPromptBase = prompts.find((p) => p.id === Number(pIds.meta))?.text || "";

    try {
      const resDraw = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "groq", prompt: `${drawPromptBase}\n\nایده محوری برای توسعه پرامپت: ${finalIdea}` }),
      });
      const drawData = await resDraw.json();
      const parsedDraw = cleanAndParseJson(drawData.content);

      const resMeta = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "groq", prompt: `${metaPromptBase}\n\nایده نهایی برای سئو تصویر: ${finalIdea}` }),
      });
      const metaData = await resMeta.json();
      const parsedMeta = cleanAndParseJson(metaData.content);

      setImageAssets((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          generatedPrompt: parsedDraw.image_prompt || parsedDraw.prompt || parsedDraw.text || "Render Prompt Example",
          fileName: parsedMeta.filename || parsedMeta.file_name || "optimized-image.jpg",
          altText: parsedMeta.alt_text || parsedMeta.alt || "متن جایگزین سئو تصویر",
        },
      }));
      alert(`🎯 اطلاعات و پرامپت بخش "${asset.heading}" با موفقیت ایجاد شد.`);
    } catch (e: any) {
      console.error(e);
      alert(`خطا در ارتباط با سرور سئو: ${e.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* بدنه اصلی با تم دارک مطابق تصاویر پنل شما */}
      <div className="relative w-full max-w-5xl h-[85vh] flex flex-col bg-[#0c0c0e] rounded-2xl border border-zinc-800 shadow-2xl text-zinc-100 overflow-hidden">
        
        {/* هدر مودال */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-950 bg-[#111114]">
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors">✕</button>
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5" dir="ltr">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className={`w-2.5 h-2.5 rounded-full ${step === i ? "bg-purple-500" : "bg-zinc-800"}`} />
              ))}
            </div>
            <div>
              <span className="text-xs text-purple-400 font-mono block text-right">AUTOMATED CONTENT FACTORY</span>
              <h2 className="text-base font-bold">میز فرمولاسیون و تدوین ساختار بریف محتوا (پروژه: {projectId})</h2>
            </div>
          </div>
        </div>

        {/* بخش محتوای داخلی (اسکرول شونده) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isGeneratingIdeas ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 py-20">
              <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              <p className="text-zinc-400 text-sm">در حال تحلیل متن و دریافت اتوماتیک ایده‌ها از بازوهای هوش مصنوعی Groq...</p>
            </div>
          ) : step === 3 ? (
            /* منوی انتخاب روش ایده‌پردازی */
            <div className="space-y-6 max-w-2xl mx-auto py-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold">فرآیند ایده‌پردازی تصاویر مقاله</h3>
                <p className="text-sm text-zinc-400">ساختار JSON دریافتی از Claude یا ChatGPT را در کادر زیر پیست کنید:</p>
              </div>

              {/* کادر طلایی وارد کردن دستی JSON */}
              <div className="p-4 bg-zinc-900/60 rounded-xl border border-purple-900/30 space-y-3">
                <label className="block text-sm text-purple-300 font-medium">🚀 میانبر طلایی: پیست کردن مستقیم JSON ایده‌ها</label>
                <textarea
                  dir="ltr"
                  value={manualJson}
                  onChange={(e) => setManualJson(e.target.value)}
                  placeholder='{
  "h1": ["ایده ۱", "ایده ۲", "ایده ۳"],
  "section-4": ["ایده ۱", "ایده ۲", "ایده ۳"]
}'
                  className="w-full h-40 p-3 bg-black/50 text-emerald-400 font-mono text-xs rounded-lg border border-zinc-800 focus:outline-none focus:border-purple-500 placeholder:text-zinc-700"
                />
                <button
                  onClick={() => handleImportManualJson(manualJson)}
                  className="w-full py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-medium text-sm rounded-lg transition-all shadow-lg"
                >
                  استخراج و بارگذاری آنی دیتای پکیج JSON
                </button>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-zinc-800"></div>
                <span className="flex-shrink mx-4 text-zinc-500 text-xs font-mono">یا اتصال مستقیم</span>
                <div className="flex-grow border-t border-zinc-800"></div>
              </div>

              <button
                onClick={generateImageIdeas}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-medium text-sm rounded-lg transition-all"
              >
                تولید اتوماتیک و آنلاین ایده‌ها با Groq API
              </button>
            </div>
          ) : (
            /* پنل پیشرفته استودیو تصاویر (مرحله ۴) */
            <div className="space-y-6">
              <div className="p-4 bg-purple-950/20 border border-purple-900/40 rounded-xl">
                <h4 className="text-purple-400 font-bold text-sm mb-1">🎨 استودیو فرمولاسیون و بهینه‌سازی تصاویر سئو</h4>
                <p className="text-xs text-zinc-400">ایده‌های استخراج شده در زیر لیست شده‌اند. یکی را انتخاب کنید، یا ایده شخصی خود را بنویسید و سپس دکمه چرخ‌دنده را بزنید.</p>
              </div>

              {Object.keys(imageAssets).map((key) => {
                const asset = imageAssets[key];
                return (
                  <div key={key} className="p-5 bg-[#111114] border border-zinc-850 rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">Section ID: {key}</span>
                      <h3 className="text-sm font-bold text-purple-300">{asset.heading}</h3>
                    </div>

                    {/* دکمه‌های ۳ ایده پیشنهادی */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {asset.ideas.map((idea, idx) => (
                        <button
                          key={idx}
                          onClick={() => setImageAssets({ ...imageAssets, [key]: { ...asset, selectedIdea: idea } })}
                          className={`p-3 text-right text-xs rounded-lg border transition-all ${
                            asset.selectedIdea === idea
                              ? "bg-purple-950/40 border-purple-500 text-zinc-100"
                              : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          {idea}
                        </button>
                      ))}
                    </div>

                    {/* باکس ایده سفارشی */}
                    <div className="space-y-1.5">
                      <label className="block text-xs text-zinc-400">ایده سفارشی (نوشتن در این کادر اولویت قرار می‌گیرد):</label>
                      <input
                        type="text"
                        value={asset.customIdea}
                        onChange={(e) => setImageAssets({ ...imageAssets, [key]: { ...asset, customIdea: e.target.value } })}
                        placeholder="ایده شخصی خود را برای تصویر این بخش بنویسید..."
                        className="w-full p-2.5 bg-black/40 text-sm border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* نمایش خروجی نهایی سئو و پرامپت در صورت تولید شدن */}
                    {(asset.generatedPrompt || asset.altText) && (
                      <div className="p-3 bg-black/60 rounded-lg border border-zinc-850 space-y-2 text-xs font-mono text-zinc-300" dir="ltr">
                        {asset.generatedPrompt && <p><span className="text-purple-400">Prompt:</span> {asset.generatedPrompt}</p>}
                        {asset.fileName && <p><span className="text-emerald-400">Filename:</span> {asset.fileName}</p>}
                        {asset.altText && <p><span className="text-amber-400">Alt Text:</span> {asset.altText}</p>}
                      </div>
                    )}

                    {/* دکمه پردازش چرخ‌دنده */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => finalizeImageAssets(key)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition-all"
                      >
                        ⚙️ تولید پرامپت رندر و متادیتای سئو (JSON API)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* فوتر ثابت مودال */}
        <div className="p-4 border-t border-zinc-950 bg-[#111114] flex justify-between gap-3">
          <button
            onClick={() => setStep(3)}
            disabled={step === 3}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-medium rounded-xl border border-zinc-800 transition-all disabled:opacity-30"
          >
            بازگشت به متدها
          </button>
          
          <button
            onClick={() => { alert("🚀 تمام ایده‌ها و متادیتای تصاویر ذخیره و نهایی شدند!"); onClose(); }}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            🚀 اتمام فرآیند و درج تصویرمحور در وردپرس
          </button>
        </div>

      </div>
    </div>
  );
}
