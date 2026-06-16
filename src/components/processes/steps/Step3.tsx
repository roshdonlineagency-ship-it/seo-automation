// یک کامپوننت کمکی کوچک برای نمایش بلاک‌های متنی
function ContentBlock({ label, value, fieldKey, corrections, setCorrections, userWantsImage, setUserWantsImage }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] text-white/50">{label}</label>
      <textarea
        value={value}
        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none min-h-[100px]"
        readOnly
      />
    </div>
  );
}

export default function Step3({ 
  articleData, corrections, setCorrections, userWantsImage, setUserWantsImage, 
  isWaitingForCorrection, setIsWaitingForCorrection, compiledCorrectionPrompt, 
  correctionPastedJson, setCorrectionPastedJson, handleApplyCorrectionJson, 
  handleGenerateCorrectionPrompt, setupImageWorkflow 
}: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ContentBlock label="متا تایتل سئو" value={articleData.meta_title} />
        <ContentBlock label="متا دیسکریپشن" value={articleData.meta_description} />
      </div>
      
      {/* لیست سکشن‌ها */}
      <div className="space-y-4">
        {articleData.sections?.map((sec: any) => (
          <ContentBlock key={sec.id} label={`سرفصل: ${sec.h2}`} value={sec.content} />
        ))}
      </div>

      {/* باکس اصلاحات */}
      {isWaitingForCorrection && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl space-y-4">
           <textarea readOnly value={compiledCorrectionPrompt} className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white/70 font-mono" />
           <textarea value={correctionPastedJson} onChange={(e) => setCorrectionPastedJson(e.target.value)} placeholder="JSON اصلاح‌شده را اینجا پیست کنید..." className="w-full h-32 bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white font-mono" />
           <button onClick={handleApplyCorrectionJson} className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs">بروزرسانی میز تحریریه</button>
        </div>
      )}

      <div className="border-t border-white/10 pt-5 flex gap-3">
        <button onClick={handleGenerateCorrectionPrompt} className="bg-amber-600 px-5 py-3 rounded-xl text-sm font-medium text-white">⚙️ ساخت پرامپت اصلاحیه</button>
        <button onClick={setupImageWorkflow} className="bg-violet-600 px-5 py-3 rounded-xl text-sm font-bold text-white flex-1">مدیریت و استودیو تصاویر ✨</button>
      </div>
    </div>
  );
}
