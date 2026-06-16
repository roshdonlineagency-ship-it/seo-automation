export default function Step4(props: any) {
  const {
    imageAssets, setImageAssets, published, publishing, ideaPromptText,
    ideasJsonInput, setIdeasJsonInput, handleParseIdeasJson, handleIdeaSelection,
    seoPromptText, seoJsonInput, setSeoJsonInput, handleParseSeoJson,
    handleFinalPublish, setStep
  } = props;

  return (
    <div className="space-y-6">
      {published ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-2xl text-center">
          <p className="text-emerald-400 font-bold mb-4">مقاله با موفقیت منتشر شد!</p>
          <a href={published} target="_blank" rel="noreferrer" className="text-emerald-500 underline text-sm">
            مشاهده پست در سایت
          </a>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* ۱. بخش تولید ایده‌های تصویر */}
          <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-2xl">
            <h4 className="text-xs font-bold text-blue-400 mb-3">۱. استودیو تصاویر</h4>
            {Object.keys(imageAssets).length === 0 ? (
              <div className="space-y-3">
                <textarea readOnly value={ideaPromptText} className="w-full h-24 bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] text-white/50 font-mono resize-none" />
                <textarea value={ideasJsonInput} onChange={(e) => setIdeasJsonInput(e.target.value)} placeholder="JSON ایده‌های تصویر را اینجا پیست کنید..." className="w-full h-24 bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white" />
                <button onClick={handleParseIdeasJson} className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-xl text-xs font-bold text-white transition-colors">
                  تحلیل و نمایش ایده‌ها
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.keys(imageAssets).map((key) => (
                  <div key={key} onClick={() => handleIdeaSelection(key)} className="p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-blue-500 transition-colors">
                    <p className="text-xs font-bold text-white">{imageAssets[key].heading}</p>
                    <p className="text-[10px] text-white/40">{imageAssets[key].description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ۲. بخش تنظیمات سئو */}
          <div className="bg-purple-500/5 border border-purple-500/10 p-5 rounded-2xl">
            <h4 className="text-xs font-bold text-purple-400 mb-3">۲. تنظیمات متا سئو</h4>
            <textarea readOnly value={seoPromptText} className="w-full h-20 bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] text-white/50 font-mono resize-none mb-3" />
            <textarea value={seoJsonInput} onChange={(e) => setSeoJsonInput(e.target.value)} placeholder="JSON سئو را اینجا پیست کنید..." className="w-full h-24 bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white" />
            <button onClick={handleParseSeoJson} className="mt-3 w-full bg-purple-600 hover:bg-purple-500 py-2 rounded-xl text-xs font-bold text-white transition-colors">
              تایید تنظیمات سئو
            </button>
          </div>

          {/* ۳. دکمه‌های نهایی */}
          <div className="border-t border-white/10 pt-5 flex gap-3">
            <button onClick={() => setStep(3)} className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl text-sm transition-colors">بازگشت</button>
            <button 
              onClick={handleFinalPublish} 
              disabled={publishing} 
              className="flex-1 bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-colors"
            >
              {publishing ? "در حال انتشار..." : "🚀 تایید نهایی و انتشار"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
