import { useState } from "react";

// اینترفیس پراپ‌های بلاک متنی (برای رعایت تایپ‌اسکریپت)
interface ContentBlockProps {
  label: string;
  value: string;
  fieldKey: string;
  corrections: Record<string, string>;
  setCorrections: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  userWantsImage: Record<string, boolean>;
  setUserWantsImage: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

// کامپوننت کمکی بلاک متنی
const ContentBlock = ({ 
  label, 
  value, 
  fieldKey, 
  corrections, 
  setCorrections, 
  userWantsImage, 
  setUserWantsImage 
}: ContentBlockProps) => (
  <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4 transition-colors hover:border-white/20">
    <div className="flex justify-between items-center">
      <span className="text-violet-400 text-xs font-bold bg-violet-500/10 px-3 py-1 rounded-full">{label}</span>
      <label className="flex items-center gap-2 cursor-pointer text-xs text-white/60 select-none">
        <input 
          type="checkbox" 
          checked={!!userWantsImage[fieldKey]} 
          onChange={(e) => setUserWantsImage((prev) => ({ ...prev, [fieldKey]: e.target.checked }))}
          className="rounded border-white/20 bg-transparent text-violet-600 focus:ring-violet-500 w-4 h-4"
        />
        نیاز به تصویر
      </label>
    </div>
    
    <div className="text-sm text-white/80 leading-7 bg-black/20 p-3 rounded-xl border border-white/5 whitespace-pre-wrap">
      {value}
    </div>

    <input
      type="text"
      value={corrections[fieldKey] || ""}
      onChange={(e) => setCorrections((prev) => ({ ...prev, [fieldKey]: e.target.value }))}
      placeholder="یادداشت یا نکته اصلاحی سردبیری..."
      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500 transition-colors"
    />
  </div>
);

export default function Step3({
  articleData,
  corrections,
  setCorrections,
  userWantsImage,
  setUserWantsImage,
  isWaitingForCorrection,
  setIsWaitingForCorrection,
  compiledCorrectionPrompt,
  correctionPastedJson,
  setCorrectionPastedJson,
  handleApplyCorrectionJson,
  handleGenerateCorrectionPrompt,
  setupImageWorkflow,
}: any) {

  if (!articleData) {
    return <div className="text-center p-10 text-white/50">در حال لودینگ دیتا...</div>;
  }

  return (
    <div className="space-y-6">
      {/* ۱. متا دیتا */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ContentBlock label="متا تایتل سئو" value={articleData.meta_title} fieldKey="meta_title" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />
        <ContentBlock label="متا دیسکریپشن" value={articleData.meta_description} fieldKey="meta_description" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ContentBlock label="کلمه کلیدی تمرکزی" value={articleData.focus_keyword} fieldKey="focus_keyword" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />
        <ContentBlock label="نامک آدرس (Slug)" value={articleData.slug} fieldKey="slug" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />
      </div>

      {/* ۲. محتوای اصلی */}
      <ContentBlock label="عنوان اصلی مقاله (H1)" value={articleData.h1} fieldKey="h1" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />
      <ContentBlock label="مقدمه" value={articleData.intro} fieldKey="intro" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />

      <div className="space-y-4">
        <p className="text-white/40 text-xs border-r-2 border-violet-500 pr-2 font-bold">بخش هدینگ‌ها و بدنه سکشن‌های مقاله</p>
        {articleData.sections?.map((sec: any) => (
          <ContentBlock 
            key={sec.id}
            label={`سرفصل دوم (H2): ${sec.h2}`} 
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

      {/* ۳. بخش اصلاحیه */}
      {isWaitingForCorrection && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl space-y-4 my-6">
          <p className="text-amber-400 text-xs font-semibold">🛠️ پرامپت اصلاحات آماده است، آن را به مدل زبانی بدهید:</p>
          <textarea readOnly value={compiledCorrectionPrompt} className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white/70 font-mono" />
          <textarea 
            value={correctionPastedJson}
            onChange={(e) => setCorrectionPastedJson(e.target.value)}
            placeholder="خروجی JSON اصلاح‌شده را اینجا پیست کنید..."
            className="w-full h-32 bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white font-mono"
          />
          <div className="flex gap-2">
            <button onClick={() => setIsWaitingForCorrection(false)} className="text-white/40 text-xs px-4">انصراف</button>
            <button onClick={handleApplyCorrectionJson} className="bg-emerald-600 px-5 py-2 rounded-xl text-xs font-medium text-white">✅ بروزرسانی</button>
          </div>
        </div>
      )}

      {/* ۴. دکمه‌های نهایی */}
      <div className="border-t border-white/10 pt-5 flex gap-3">
        <button onClick={handleGenerateCorrectionPrompt} className="bg-amber-600 hover:bg-amber-500 px-5 py-3.5 rounded-xl text-sm font-medium text-white flex-1">
          ⚙️ ساخت پرامپت اصلاحیه
        </button>
        <button onClick={setupImageWorkflow} className="bg-violet-600 hover:bg-violet-500 px-5 py-3.5 rounded-xl text-sm font-bold text-white flex-1">
          گام بعد: استودیو تصاویر ✨
        </button>
      </div>
    </div>
  );
}
