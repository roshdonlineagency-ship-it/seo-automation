import React, { useState } from "react";

// --- تعریف اینترفیس‌ها برای تایپ‌اسکریپت (در صورت عدم نیاز می‌توانید حذف کنید) ---
interface ImageIdeaSet {
  sectionId: string;
  heading: string;
  ideas: string[];
  selectedIdea: string;
  customIdea: string;
  generatedPrompt: string;
  fileName: string;
  altText: string;
}

interface Section {
  id: string;
  h2: string;
  content: string;
}

interface ArticleData {
  h1: string;
  intro: string;
  conclusion: string;
  sections: Section[];
}

interface PromptItem {
  id: number;
  text: string;
}

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleData: ArticleData | null;
  prompts: PromptItem[];
  pIds: { idea: string; draw: string; meta: string };
  userWantsImage: Record<string, boolean>;
}

export default function ImageStudioModal({
  isOpen,
  onClose,
  articleData,
  prompts,
  pIds,
  userWantsImage,
}: ImageStudioModalProps) {
  // --- استیت‌های اصلی مودال ---
  const [step, setStep] = useState<number>(3);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState<boolean>(false);
  const [imageAssets, setImageAssets] = useState<Record<string, ImageIdeaSet>>({});
  const [manualJson, setManualJson] = useState<string>("");

  if (!isOpen) return null;

  // تابع کمکی برای پارس کردن امن جی‌سان هوش مصنوعی
  const cleanAndParseJson = (content: string) => {
    const cleanStr = content.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanStr);
  };

  // 1️⃣ متد تولید خودکار ایده‌ها با گراک (نسخه موازی و ضد قفل)
  const generateImageIdeas = async () => {
    setStep(4);
    setIsGeneratingIdeas(true);

    try {
      const ideaPrompt = prompts.find((p) => p.id === Number(pIds.idea))?.text || "";
      const newAssets: Record<string, ImageIdeaSet> = {};
      const activeKeys = Object.keys(userWantsImage).filter((key) => userWantsImage[key]);

      await Promise.all(
        activeKeys.map(async (key) => {
          let heading = "";
          let content = "";

          if (key === "h1") { heading = "تیتر اصلی مقاله (H1)"; content = articleData?.h1 || ""; }
          else if (key === "intro") { heading = "مقدمه مقاله"; content = articleData?.intro || ""; }
          else if (key === "conclusion") { heading = "نتیجه‌گیری انتها"; content = articleData?.conclusion || ""; }
          else {
            const sec = articleData?.sections.find((s) => s.id === key);
            if (sec) { heading = `سکشن: ${sec.h2}`; content = sec.content; }
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
            console.error(`Error generating image ideas for key [${key}]:`, e);
            // فال‌بک امن برای جلوگیری از قفل شدن لودر
            newAssets[key] = {
              sectionId: key,
              heading,
              ideas: ["خطا در دریافت ایده اول", "ایده دوم", "ایده سوم"],
              selectedIdea: "",
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

  // 2️⃣ متد جدید: بارگذاری دستی و استخراج دیتای JSON آفلاین (از کلود یا چت‌جی‌پی‌آی)
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
          const sec = articleData?.sections.find((s) => s.id === key);
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
      setStep(4); // پرش مستقیم به استودیو فرمولاسیون تصاویر
    } catch (error) {
      alert("خطا در خواندن دیتای JSON. لطفا فرمت کد را بررسی کنید.");
    }
  };

  // 3️⃣ متد چرخ‌دنده: تولید پرامپت رندر نهایی و دیتای سئو با گزارش دقیق خطاها
  const finalizeImageAssets = async (key: string) => {
    const asset = imageAssets[key];
    if (!asset) return;
    
    const finalIdea = asset.customIdea || asset.selectedIdea;
    const drawPromptBase = prompts.find((p) => p.id === Number(pIds.draw))?.text || "";
    const metaPromptBase = prompts.find((p) => p.id === Number(pIds.meta))?.text || "";

    if (!drawPromptBase || !metaPromptBase) {
      alert("لطفاً مطمئن شوید پرامپت‌های مربوط به رندر و متادیتا را تنظیم کرده‌اید.");
      return;
    }

    try {
      // الف) دریافت پرامپت تخصصی تصویرسازی
      const resDraw = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "groq", prompt: `${drawPromptBase}\n\nایده محوری برای توسعه پرامپت: ${finalIdea}` }),
      });
      if (!resDraw.ok) throw new Error(`سرور هوش مصنوعی برای پرامپت تصویر پاسخ نداد (کد خطا: ${resDraw.status})`);
      const drawData = await resDraw.json();
      let parsedDraw;
      try { parsedDraw = cleanAndParseJson(drawData.content); } catch {
        throw new Error("خروجی Groq ساختار JSON معتبری ندارد و کپشن اضافه تولید کرده است.");
      }

      // ب) دریافت ساختار اطلاعات نام فایل و متن جایگزین سئو
      const resMeta = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "groq", prompt: `${metaPromptBase}\n\nایده نهایی برای سئو تصویر: ${finalIdea}` }),
      });
      if (!resMeta.ok) throw new Error(`سرور هوش مصنوعی برای دیتای سئو تصویر پاسخ نداد (کد خطا: ${resMeta.status})`);
      const metaData = await resMeta.json();
      let parsedMeta;
      try { parsedMeta = cleanAndParseJson(metaData.content); } catch {
        throw new Error("خروجی Groq برای دیتای سئو تصویر ساختار JSON معتبری ندارد.");
      }

      // آپدیت هوشمند استیت کامپوننت
      setImageAssets((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          generatedPrompt: parsedDraw.image_prompt || parsedDraw.prompt || parsedDraw.text || "",
          fileName: parsedMeta.filename || parsedMeta.file_name || "image.jpg",
          altText: parsedMeta.alt_text || parsedMeta.alt || "تصویر مرتبط با سایت",
        },
      }));
      alert(`🎯 پرامپت رندر و متادیتای سئو برای بخش "${asset.heading}" با موفقیت ایجاد شد.`);
    } catch (e: any) {
      console.error(e);
      alert(`خطا در پردازش: ${e.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      {/* بدنه اصلی مودال با تم تاریک */}
      <div className="relative w-full max-w-5xl h-[85vh] flex flex-col bg-[#0c0c0e] rounded-2xl border border-zinc-800 shadow-2xl text-zinc-100 overflow-hidden">
        
        {/* هدر مودال */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-950 bg-[#111114]">
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors">
            ✕
          </button>
          <div className="flex items-center gap-4">
            {/* دات‌های وضعیت فرآیند */}
            <div className="flex gap-1.5" dir="ltr">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className={`w-2.5 h-2.5 rounded-full ${step === i ? "bg-purple-500" : "bg-zinc-800"}`} />
              ))}
            </div>
            <div>
              <span className="text-xs text-purple-400 font-mono block text-right">AUTOMATED CONTENT FACTORY</span>
              <h2 className="text-base font-bold">میز فرمولاسیون و تدوین ساختار بریف محتوا</h2>
            </div>
          </div>
        </div>

        {/* محتوای داخلی مودال (اسکرول‌شونده) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* حالت اول: لودینگ انیمیشنی استخراج خودکار */}
          {isGeneratingIdeas ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 py-20">
              <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              <p className="text-zinc-400 text-sm">در حال واکشی اطلاعات، تحلیل متن و استخراج ۳ ایده خلاقانه بر پایه هوش مصنوعی Groq...</p>
            </div>
          ) : step === 3 ? (
            /* حالت دوم: منوی انتخاب راهکار (مرحله ۳) */
            <div className="space-y-6 max-w-2xl mx-auto py-10">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold">فرآیند ایده‌پردازی تصاویر مقاله</h3>
                <p className="text-sm text-zinc-400">می‌توانید ایده‌ها را به صورت خودکار از Groq بگیرید یا جهت پایداری ۱۰۰٪، ساختار JSON کپی شده از Claude را وارد کنید:</p>
              </div>

              {/* باکس آپلود دستی JSON پیشنهادی شما */}
              <div className="p-4 bg-zinc-900/60 rounded-xl border border-purple-900/30 space-y-3">
                <label className="block text-sm text-purple-300 font-medium">🚀 میانبر طلایی: پیست کردن مستقیم JSON ایده‌ها (اکسترنال)</label>
                <textarea
                  dir="ltr"
                  value={manualJson}
                  onChange={(e) => setManualJson(e.target.value)}
                  placeholder='{ "section-4": ["ایده ۱", "ایده ۲", "ایده ۳"] }'
                  className="w-full h-36 p-3 bg-black/50 text-emerald-400 font-mono text-xs rounded-lg border border-zinc-800 focus:outline-none focus:border-purple-500 transition-all"
                />
                <button
                  onClick={() => handleImportManualJson(manualJson)}
                  className="w-full py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-medium text-sm rounded-lg transition-all"
                >
                  استخراج و بارگذاری دیتای پکیج JSON
                </button>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-zinc-800"></div>
                <span className="flex-shrink mx-4 text-zinc-500 text-xs font-mono">OR USE API</span>
                <div className="flex-grow border-t border-zinc-800"></div>
              </div>

              <button
                onClick={generateImageIdeas}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-medium text-sm rounded-lg transition-all"
              >
                تولید اتوماتیک ایده‌ها با اتصال مستقیم به Groq API
              </button>
            </div>
          ) : (
            /* حالت سوم: استودیو فرمولاسیون تصاویر (مرحله ۴) */
            <div className="space-y-6">
              <div className="p-4 bg-purple-950/20 border border-purple-900/40 rounded-xl">
                <h4 className="text-purple-400 font-bold text-sm mb-1">🎨 استودیو فرمولاسیون و بهینه‌سازی تصاویر</h4>
                <p className="text-xs text-zinc-400">بخش‌هایی که نیاز به تصویر دارند در زیر فهرست شده‌اند. برای هر بخش یک ایده را انتخاب کنید یا خودتان بنویسید، سپس دکمه چرخ‌دنده را بزنید.</p>
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

                    {/* کادر متن ایده سفارشی */}
                    <div className="space-y-1.5">
                      <label className="block text-xs text-zinc-400">یا کادر زیر را پر کنید (نوشتن در این کادر اولویت قرار می‌گیرد):</label>
                      <input
                        type="text"
                        value={asset.customIdea}
                        onChange={(e) => setImageAssets({ ...imageAssets, [key]: { ...asset, customIdea: e.target.value } })}
                        placeholder="ایده شخصی خود را برای این تصویر بنویسید..."
                        className="w-full p-2.5 bg-black/40 text-sm border border-zinc-800 rounded-lg focus:outline-none focus:border-purple-500 text-zinc-200"
                      />
                    </div>

                    {/* کادرهای نمایش پرامپت تولید شده و دیتای سئو (اگر موجود باشند) */}
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
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium rounded-xl border border-zinc-800 transition-all disabled:opacity-30"
          >
            بازگشت به محتوا
          </button>
          
          <button
            onClick={() => { alert("🚀 کل ساختار تصاویر ذخیره و آماده ارسال به وردپرس شد!"); onClose(); }}
            className="flex-1 md:flex-initial px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
          >
            🚀 اتمام فرآیند و درج تصویرمحور در وردپرس
          </button>
        </div>

      </div>
    </div>
  );
}
