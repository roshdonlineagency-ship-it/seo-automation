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

  // اگر دیتا هنوز لود نشده
  if (!articleData) {
    return <div className="p-8 text-center text-white/30">در حال بارگذاری داده‌های مقاله...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">✍️ میز سردبیری و اصلاحات</h3>

      {/* ۱. نمایش متاها */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5">
          <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">متا تایتل</label>
          <p className="text-sm text-white mt-1">{articleData.seo_title || "بدون عنوان"}</p>
        </div>
        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5">
          <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">متا دیسکریپشن</label>
          <p className="text-sm text-white mt-1">{articleData.meta_description || "بدون توضیحات"}</p>
        </div>
      </div>

      {/* ۲. باکس اصلاحیه */}
      <div className="bg-amber-900/10 border border-amber-900/30 p-5 rounded-xl">
        <h4 className="text-amber-500 font-bold mb-3 text-sm">🔄 بازنویسی و اصلاح متن</h4>
        {!isWaitingForCorrection ? (
          <button 
            onClick={handleGenerateCorrectionPrompt}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-all"
          >
            ایجاد پرامپت اصلاحیه
          </button>
        ) : (
          <div className="space-y-4">
            <textarea readOnly value={compiledCorrectionPrompt} className="w-full h-20 bg-black/50 text-[10px] text-white/70 p-3 rounded-lg border border-white/10" />
            <textarea 
              placeholder="خروجی JSON اصلاح شده را اینجا پیست کنید..."
              value={correctionPastedJson}
              onChange={(e) => setCorrectionPastedJson(e.target.value)}
              className="w-full h-24 bg-black/50 text-white p-3 text-xs rounded-lg border border-emerald-500/50 focus:border-emerald-500 outline-none"
            />
            <button 
              onClick={handleApplyCorrectionJson}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg"
            >
              ✅ اعمال اصلاحات روی دیتا
            </button>
          </div>
        )}
      </div>

      {/* ۳. تنظیمات تصویر */}
      <div className="flex flex-col gap-4 mt-2">
        <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
          <input 
            type="checkbox" 
            checked={userWantsImage} 
            onChange={(e) => setUserWantsImage(e.target.checked)}
            className="w-5 h-5 accent-indigo-500"
          />
          <span className="text-white text-sm">تولید تصاویر هوشمند برای این مقاله فعال باشد</span>
        </label>

        <button 
          onClick={setupImageWorkflow}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-900/20 transition-all"
        >
          {userWantsImage ? "انتقال به مرحله تصویرسازی (مرحله ۴) 🎨" : "تایید نهایی و انتشار مقاله 🚀"}
        </button>
      </div>
    </div>
  );
}
