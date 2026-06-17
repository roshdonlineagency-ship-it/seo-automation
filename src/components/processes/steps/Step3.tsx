import React from "react";

// --- اینترفیس‌ها برای جلوگیری از خطای TypeScript ---
interface Section {
  id: string;
  h2: string;
  content: string;
  needs_image: boolean;
  image_priority: string;
}

interface ArticleData {
  meta_title: string;
  meta_description: string;
  h1: string;
  intro: string;
  sections: Section[];
  conclusion: string;
}

interface ContentBlockProps {
  label: string;
  value: string;
  fieldKey: string;
  needs_image?: boolean;
  image_priority?: string;
  corrections: Record<string, string>;
  setCorrections: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  userWantsImage: Record<string, boolean>;
  setUserWantsImage: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

// --- کامپوننت داخلی برای نمایش هر بخش ---
const ContentBlock = ({ 
  label, 
  value, 
  fieldKey, 
  needs_image, 
  image_priority, 
  corrections, 
  setCorrections, 
  userWantsImage, 
  setUserWantsImage 
}: ContentBlockProps) => (
  <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4 hover:border-white/20 transition-all">
    <div className="flex justify-between items-start">
      <div className="flex flex-col gap-2">
        <span className="text-violet-400 text-xs font-bold bg-violet-500/10 px-3 py-1 rounded-full w-fit">{label}</span>
        
        {/* نمایش برچسب‌های وضعیت تصویر */}
        {needs_image !== undefined && (
          <div className="flex gap-2 text-[10px]">
            <span className={`px-2 py-0.5 rounded ${needs_image ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
              {needs_image ? "نیاز به تصویر: بله" : "نیاز به تصویر: خیر"}
            </span>
            {image_priority && (
              <span className={`px-2 py-0.5 rounded ${image_priority === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                اولویت: {image_priority}
              </span>
            )}
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-xs text-white/60 select-none border border-white/5 p-2 rounded-lg hover:bg-white/5">
        <input 
          type="checkbox" 
          checked={!!userWantsImage[fieldKey]} 
          onChange={(e) => setUserWantsImage((prev) => ({ ...prev, [fieldKey]: e.target.checked }))}
          className="rounded border-white/20 bg-transparent text-violet-600 focus:ring-violet-500 w-4 h-4"
        />
        انتخاب برای تولید
      </label>
    </div>
    
    <div className="text-sm text-white/80 leading-7 bg-black/20 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
      {value}
    </div>

    <input
      type="text"
      value={corrections[fieldKey] || ""}
      onChange={(e) => setCorrections((prev) => ({ ...prev, [fieldKey]: e.target.value }))}
      placeholder="📝 وارد کردن یادداشت اصلاحی برای این بخش..."
      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 transition-colors"
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
  correctionPastedJson,
  setCorrectionPastedJson,
  handleApplyCorrectionJson,
  handleGenerateCorrectionPrompt,
  setupImageWorkflow,
}: any) {

  if (!articleData) {
    return <div className="text-center p-10 text-white/50">در حال دریافت داده‌های مقاله...</div>;
  }

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      <h3 className="text-xl font-bold text-white border-b border-white/10 pb-4">✍️ میز سردبیری و اصلاحات</h3>
      
      {/* ۱. متا دیتا */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ContentBlock label="متا تایتل" value={articleData.meta_title} fieldKey="meta_title" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />
        <ContentBlock label="متا دیسکریپشن" value={articleData.meta_description} fieldKey="meta_description" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />
      </div>

      {/* ۲. محتوای اصلی */}
      <ContentBlock label="عنوان اصلی (H1)" value={articleData.h1} fieldKey="h1" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />
      <ContentBlock label="مقدمه" value={articleData.intro} fieldKey="intro" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />

      {/* ۳. بخش‌های بدنه مقاله (بسیار مهم) */}
      <div className="space-y-4">
        <h4 className="text-white/50 text-sm font-bold mt-6 mb-2">بخش‌های بدنه (Sections)</h4>
        {articleData.sections?.map((sec: Section) => (
          <ContentBlock 
            key={sec.id}
            label={`سرفصل: ${sec.h2}`} 
            fieldKey={sec.id} 
            value={sec.content}
            needs_image={sec.needs_image}
            image_priority={sec.image_priority}
            corrections={corrections}
            setCorrections={setCorrections}
            userWantsImage={userWantsImage}
            setUserWantsImage={setUserWantsImage}
          />
        ))}
      </div>

      <ContentBlock label="جمع‌بندی" value={articleData.conclusion} fieldKey="conclusion" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />

      {/* ۴. باکس اصلاحیه هوشمند */}
      <div className="bg-gradient-to-br from-amber-900/20 to-black p-6 rounded-2xl border border-amber-900/30 space-y-4">
        {!isWaitingForCorrection ? (
          <button onClick={handleGenerateCorrectionPrompt} className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-900/20">
            ⚙️ ساخت پرامپت اصلاحیه براساس یادداشت‌ها
          </button>
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <p className="text-amber-400 text-xs font-bold uppercase">پرامپت اصلاحیه ساخته شد:</p>
            <textarea readOnly value={compiledCorrectionPrompt} className="w-full h-24 bg-black/50 text-[10px] text-white/70 p-3 rounded-lg border border-white/10 font-mono" />
            <textarea 
              placeholder="خروجی JSON اصلاح شده را اینجا پیست کنید..."
              value={correctionPastedJson}
              onChange={(e) => setCorrectionPastedJson(e.target.value)}
              className="w-full h-24 bg-black/50 text-white p-3 text-xs rounded-lg border border-emerald-500/50 focus:border-emerald-500 outline-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setIsWaitingForCorrection(false)} className="px-4 py-2 text-xs text-white/50 hover:text-white">انصراف</button>
              <button onClick={handleApplyCorrectionJson} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg">✅ اعمال اصلاحات</button>
            </div>
          </div>
        )}
      </div>

      {/* ۵. دکمه نهایی */}
      <button onClick={setupImageWorkflow} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-violet-900/20 transition-all">
        {userWantsImage ? "انتقال به مرحله تصویرسازی (مرحله ۴) 🎨" : "تایید نهایی و انتشار 🚀"}
      </button>
    </div>
  );
}
