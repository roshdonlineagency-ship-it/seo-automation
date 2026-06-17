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
  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h3 className="text-lg font-bold text-white">✍️ مرحله ۳: میز سردبیری و اصلاحات</h3>
      </div>

      {/* نمایش متون (در اینجا می‌توانید اینپوت‌ها را ویرایش‌شدنی کنید) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 p-4 rounded-xl">
          <label className="text-[10px] text-white/50 uppercase font-bold">متا تایتل</label>
          <p className="text-sm text-white mt-1">{articleData?.seo_title}</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl">
          <label className="text-[10px] text-white/50 uppercase font-bold">متا دیسکریپشن</label>
          <p className="text-sm text-white mt-1">{articleData?.meta_description}</p>
        </div>
      </div>

      {/* بخش اصلاحیه */}
      <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl">
        {!isWaitingForCorrection ? (
          <button 
            onClick={handleGenerateCorrectionPrompt}
            className="w-full py-3 bg-amber-600/20 hover:bg-amber-600/40 text-amber-500 text-sm font-bold rounded-lg transition-colors border border-amber-500/30"
          >
            🔄 ایجاد پرامپت اصلاحیه و بازنویسی
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-amber-500 text-xs font-bold">پرامپت تولید شد! آن را در چت‌بات استفاده کنید و نتیجه JSON را اینجا قرار دهید:</p>
            <textarea 
              readOnly 
              value={compiledCorrectionPrompt}
              className="w-full h-24 bg-black/40 text-white/70 p-3 text-[10px] rounded-lg border border-white/10 font-mono"
            />
            <textarea 
              placeholder="JSON خروجی اصلاح شده را اینجا پیست کنید..."
              value={correctionPastedJson}
              onChange={(e) => setCorrectionPastedJson(e.target.value)}
              className="w-full h-24 bg-black/40 text-white p-3 text-xs rounded-lg border border-emerald-500/30 focus:border-emerald-500 outline-none"
            />
            <button 
              onClick={handleApplyCorrectionJson}
              className="w-full py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg"
            >
              ✅ اعمال اصلاحات روی دیتای مقاله
            </button>
          </div>
        )}
      </div>

      {/* تنظیمات نهایی */}
      <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl">
        <label className="text-white text-sm flex items-center gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            checked={userWantsImage} 
            onChange={(e) => setUserWantsImage(e.target.checked)}
            className="w-4 h-4 rounded border-white/20"
          />
          نیاز به تولید تصویر برای این مقاله دارم
        </label>
      </div>

      {/* دکمه نهایی */}
      <button 
        onClick={setupImageWorkflow}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold transition-all"
      >
        {userWantsImage ? "انتقال به مرحله تصویرسازی (مرحله ۴) 🎨" : "تایید نهایی و انتشار مقاله 🚀"}
      </button>
    </div>
  );
}
