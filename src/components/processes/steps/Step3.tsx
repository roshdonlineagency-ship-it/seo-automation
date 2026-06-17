import React, { useState } from "react";

// --- اینترفیس‌ها برای پایداری کامل تایپ‌اسکریپت ---
interface Section {
  id: string;
  h2: string;
  content: string;
  needs_image: boolean;
  image_priority: string;
  image_suggestion: string;
}

interface ContentBlockProps {
  label: string;
  value: string;
  fieldKey: string;
  corrections: Record<string, string>;
  setCorrections: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  userWantsImage: Record<string, boolean>;
  setUserWantsImage: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

// --- کامپوننت نمایش و ویرایش بلاک‌ها ---
const ContentBlock = ({ 
  label, 
  value, 
  fieldKey, 
  corrections, 
  setCorrections, 
  userWantsImage, 
  setUserWantsImage 
}: ContentBlockProps) => (
  <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4 hover:border-white/20 transition-all">
    <div className="flex justify-between items-center">
      <span className="text-violet-400 text-xs font-bold bg-violet-500/10 px-3 py-1 rounded-full">{label}</span>
      <label className="flex items-center gap-2 cursor-pointer text-xs text-white/50 hover:text-white">
        <input 
          type="checkbox" 
          checked={!!userWantsImage[fieldKey]} 
          onChange={(e) => setUserWantsImage((prev) => ({ ...prev, [fieldKey]: e.target.checked }))}
          className="w-4 h-4 rounded border-white/20 bg-transparent text-violet-600 focus:ring-violet-500"
        />
        تصویر
      </label>
    </div>
    
    <div className="text-sm text-white/80 leading-7 bg-black/30 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
      {value}
    </div>

    <input
      type="text"
      value={corrections[fieldKey] || ""}
      onChange={(e) => setCorrections((prev) => ({ ...prev, [fieldKey]: e.target.value }))}
      placeholder="یادداشت اصلاحی برای این بخش (اگر اصلاحی نداری خالی بگذار)..."
      className="w-full bg-black/40 border border-violet-500/30 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500 transition-colors"
    />
  </div>
);

// --- کامپوننت اصلی Step3 ---
export default function Step3({
  articleData,
  corrections,
  setCorrections,
  userWantsImage,
  setUserWantsImage,
  isWaitingForCorrection,
  setIsWaitingForCorrection,
  compiledCorrectionPrompt,
  setCompiledCorrectionPrompt,
  correctionPastedJson,
  setCorrectionPastedJson,
  handleApplyCorrectionJson,
  setupImageWorkflow,
}: any) {

  // تابع تولید پرامپت اصلاحی که هوشمندانه اصلاحات را به مدل می‌فرستد
  const handleGenerateCorrectionPrompt = () => {
    const prompt = `
تو یک سردبیر ارشد هستی. وظیفه تو بازنویسی و اصلاح مقاله بر اساس "یادداشت‌های سردبیر" است.

قوانین اجباری برای خروجی JSON:
1. خروجی باید فقط یک JSON معتبر باشد (بدون هیچ مقدمه یا توضیحی).
2. ساختار JSON (شامل تمام بخش‌ها) باید دقیقاً حفظ شود.
3. در هر سکشن، فیلد "status" را اضافه کن:
   - اگر در یادداشت‌های سردبیر، متنی برای آن بخش نوشته شده، اصلاحات را اعمال کن و status را "اصلاح شد" بگذار.
   - اگر یادداشتی برای بخش وجود ندارد، متن اصلی را عینا کپی کن و status را "تایید شده" بگذار.
4. مقدمه (intro) را طبق یادداشت، خلاصه کن.

دیتای فعلی مقاله (JSON):
${JSON.stringify(articleData, null, 2)}

یادداشت‌های سردبیر (فقط برای بخش‌های خاص):
${JSON.stringify(corrections, null, 2)}
`;
    setCompiledCorrectionPrompt(prompt);
    setIsWaitingForCorrection(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(compiledCorrectionPrompt);
    alert("پرامپت با موفقیت کپی شد!");
  };

  if (!articleData) {
    return <div className="text-center p-10 text-white/50">در حال دریافت داده‌ها...</div>;
  }

  return (
    <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
      <h3 className="text-xl font-bold text-white border-b border-white/10 pb-4">✍️ میز سردبیری و اصلاحات</h3>
      
      {/* ۱. متا دیتا */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ContentBlock label="متا تایتل" value={articleData.meta_title} fieldKey="meta_title" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />
        <ContentBlock label="متا دیسکریپشن" value={articleData.meta_description} fieldKey="meta_description" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />
      </div>

      {/* ۲. محتوای بدنه */}
      <ContentBlock label="H1" value={articleData.h1} fieldKey="h1" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />
      <ContentBlock label="مقدمه" value={articleData.intro} fieldKey="intro" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />

      <div className="space-y-4">
        <h4 className="text-white/40 text-xs font-bold uppercase tracking-widest pl-2">بخش‌های بدنه</h4>
        {articleData.sections?.map((sec: Section) => (
          <ContentBlock 
            key={sec.id}
            label={`سرفصل: ${sec.h2}`} 
            fieldKey={sec.id} 
            value={sec.content}
            corrections={corrections}
            setCorrections={setCorrections}
            userWantsImage={userWantsImage}
            setUserWantsImage={setUserWantsImage}
          />
        ))}
      </div>

      <ContentBlock label="جمع‌بندی" value={articleData.conclusion} fieldKey="conclusion" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />

      {/* ۳. بخش اصلاحیه هوشمند */}
      <div className="bg-gradient-to-br from-amber-900/10 to-black p-6 rounded-2xl border border-amber-900/30 space-y-4">
        {!isWaitingForCorrection ? (
          <button 
            onClick={handleGenerateCorrectionPrompt} 
            className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all shadow-lg"
          >
            ⚙️ تولید پرامپت اصلاحیه براساس یادداشت‌ها
          </button>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <span className="text-amber-400 text-xs font-bold uppercase">پرامپت آماده استفاده:</span>
                <button 
                  onClick={copyToClipboard}
                  className="bg-white/10 hover:bg-white/20 text-white text-[10px] px-3 py-1 rounded-full transition-all"
                >
                  📋 کپی متن پرامپت
                </button>
            </div>
            
            <textarea 
              readOnly 
              value={compiledCorrectionPrompt} 
              className="w-full h-32 bg-black/50 text-[10px] text-white/70 p-3 rounded-lg border border-white/10 font-mono" 
            />
            
            <textarea 
              placeholder="خروجی JSON اصلاح‌شده (که دارای فیلدهای status است) را اینجا پیست کنید..."
              value={correctionPastedJson}
              onChange={(e) => setCorrectionPastedJson(e.target.value)}
              className="w-full h-32 bg-black/60 text-white p-3 text-xs rounded-lg border border-emerald-500/50 focus:border-emerald-500 outline-none"
            />
            
            <button 
              onClick={handleApplyCorrectionJson} 
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all"
            >
              ✅ اعمال اصلاحات روی دیتا
            </button>
          </div>
        )}
      </div>

      {/* ۴. دکمه نهایی */}
      <button 
        onClick={setupImageWorkflow} 
        className="w-full bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-violet-900/20 transition-all"
      >
        {userWantsImage ? "انتقال به مرحله تصویرسازی (مرحله ۴) 🎨" : "تایید نهایی و انتشار مقاله 🚀"}
      </button>
    </div>
  );
}
