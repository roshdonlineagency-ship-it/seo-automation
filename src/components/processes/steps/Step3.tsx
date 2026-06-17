import React, { useState } from "react";

interface Section {
  id: string;
  h2: string;
  content: string;
  needs_image: boolean;
  image_priority: string;
  image_suggestion: string;
}

const ContentBlock = ({ label, value, fieldKey, needs_image, image_priority, corrections, setCorrections, userWantsImage, setUserWantsImage }: any) => (
  <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4 hover:border-white/20 transition-all">
    <div className="flex justify-between items-start">
      <div className="flex flex-col gap-2">
        <span className="text-violet-400 text-xs font-bold bg-violet-500/10 px-3 py-1 rounded-full w-fit">{label}</span>
      </div>
      <label className="flex items-center gap-2 cursor-pointer text-xs text-white/60 select-none">
        <input type="checkbox" checked={!!userWantsImage[fieldKey]} onChange={(e) => setUserWantsImage((prev: any) => ({ ...prev, [fieldKey]: e.target.checked }))} className="rounded border-white/20 bg-transparent text-violet-600 w-4 h-4" />
        تصویر؟
      </label>
    </div>
    <div className="text-sm text-white/80 leading-7 bg-black/20 p-4 rounded-xl border border-white/5">{value}</div>
    <input
      type="text"
      value={corrections[fieldKey] || ""}
      onChange={(e) => setCorrections((prev: any) => ({ ...prev, [fieldKey]: e.target.value }))}
      placeholder="📝 یادداشت اصلاحی برای این بخش..."
      className="w-full bg-black/40 border border-violet-500/30 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500"
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
  setCompiledCorrectionPrompt,
  compiledCorrectionPrompt,
  correctionPastedJson,
  setCorrectionPastedJson,
  handleApplyCorrectionJson,
}: any) {

  // تابع تولید پرامپت هوشمند که یادداشت‌ها را ضمیمه می‌کند
  const handleGenerateCorrectionPrompt = () => {
    const prompt = `
تو یک سردبیر ارشد هستی. وظیفه تو بازنویسی مقاله بر اساس نکات زیر است.

دستورالعمل‌های حیاتی:
1. فقط یک JSON معتبر برگردان (بدون هیچ توضیحی).
2. ساختار JSON را دقیقاً حفظ کن.
3. برای هر سکشن، حتماً فیلد "status" اضافه کن:
   - اگر یادداشتی برایش نوشته شده: بنویس "اصلاح شد"
   - اگر یادداشتی ندارد: بنویس "تایید شده"
4. یادداشت‌های سردبیر را برای هر بخش اعمال کن.

دیتای فعلی مقاله:
${JSON.stringify(articleData, null, 2)}

یادداشت‌های اصلاحی سردبیر:
${JSON.stringify(corrections, null, 2)}
`;
    setCompiledCorrectionPrompt(prompt);
    setIsWaitingForCorrection(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(compiledCorrectionPrompt);
    alert("پرامپت کپی شد!");
  };

  if (!articleData) return <div className="text-center p-10 text-white/50">در حال لودینگ...</div>;

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
      <h3 className="text-xl font-bold text-white border-b border-white/10 pb-4">✍️ میز سردبیری</h3>

      {/* نمایش بخش‌ها */}
      <ContentBlock label="H1" value={articleData.h1} fieldKey="h1" corrections={corrections} setCorrections={setCorrections} />
      <ContentBlock label="مقدمه" value={articleData.intro} fieldKey="intro" corrections={corrections} setCorrections={setCorrections} />
      
      {articleData.sections?.map((sec: Section) => (
        <ContentBlock 
          key={sec.id}
          label={`سرفصل: ${sec.h2}`} 
          fieldKey={sec.id} 
          value={sec.content}
          corrections={corrections} 
          setCorrections={setCorrections}
        />
      ))}

      {/* باکس اصلاحیه */}
      <div className="bg-gradient-to-br from-amber-900/20 to-black p-6 rounded-2xl border border-amber-900/30 space-y-4">
        {!isWaitingForCorrection ? (
          <button onClick={handleGenerateCorrectionPrompt} className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl">
            ⚙️ تولید پرامپت اصلاحیه با اعمال یادداشت‌ها
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
                <span className="text-amber-400 text-xs font-bold">پرامپت آماده کپی:</span>
                <button onClick={copyToClipboard} className="text-[10px] bg-white/10 px-2 py-1 rounded text-white hover:bg-white/20">📋 کپی پرامپت</button>
            </div>
            <textarea readOnly value={compiledCorrectionPrompt} className="w-full h-32 bg-black/50 text-[10px] text-white/70 p-3 rounded-lg border border-white/10 font-mono" />
            
            <textarea 
              placeholder="خروجی JSON اصلاح شده را اینجا پیست کن..."
              value={correctionPastedJson}
              onChange={(e) => setCorrectionPastedJson(e.target.value)}
              className="w-full h-32 bg-black/60 text-white p-3 text-xs rounded-lg border border-emerald-500/50"
            />
            <button onClick={handleApplyCorrectionJson} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg">✅ اعمال اصلاحات</button>
          </div>
        )}
      </div>
    </div>
  );
}
