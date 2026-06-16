export default function Step4({ 
  imageAssets, setImageAssets, published, publishing, ideaPromptText, 
  ideasJsonInput, setIdeasJsonInput, handleParseIdeasJson, handleIdeaSelection, 
  seoPromptText, seoJsonInput, setSeoJsonInput, handleParseSeoJson, 
  handleFinalPublish, setStep 
}: any) {
  return (
    <div className="space-y-6">
      {published ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-2xl text-center">
          <p className="text-emerald-400 font-bold">مقاله منتشر شد!</p>
          <a href={published} target="_blank" className="text-emerald-500 underline">مشاهده پست</a>
        </div>
      ) : (
        <div className="space-y-6">
          {/* بخش تولید ایده */}
          {Object.keys(imageAssets).length === 0 && (
             <div className="bg-blue-500/10 p-5 rounded-2xl">
               <textarea readOnly value={ideaPromptText} className="w-full h-32 bg-black/40 border-white/10 rounded-xl p-3 text-xs text-white/70" />
               <textarea value={ideasJsonInput} onChange={(e) => setIdeasJsonInput(e.target.value)} className="w-full h-32 mt-3 bg-black/60 border-white/10 rounded-xl p-3 text-xs text-white" />
               <button onClick={handleParseIdeasJson} className="mt-3 w-full bg-emerald-600 p-3 rounded-xl text-xs font-bold text-white">تایید و نمایش ایده‌ها</button>
             </div>
          )}

          {/* بخش نمایش لیست تصاویر */}
          {Object.keys(imageAssets).length > 0 && (
            <div className="space-y-4">
               {Object.keys(imageAssets).map((key) => (
                 <div key={key} className="p-4 rounded-xl bg-white/5 border border-white/10">
                   <p className="text-xs font-bold text-violet-400">{imageAssets[key].heading}</p>
                   {/* اینجا کدهای رادیو باتن و انتخاب تصویر را قرار بده */}
                   <input type="file" onChange={(e) => {/* لاجیک آپلود */}} className="mt-2 text-xs" />
                 </div>
               ))}
            </div>
          )}

          <div className="border-t border-white/10 pt-5 flex gap-3">
             <button onClick={() => setStep(3)} className="bg-white/5 px-6 py-3 rounded-xl text-sm">بازگشت</button>
             <button onClick={handleFinalPublish} disabled={publishing} className="flex-1 bg-violet-600 px-6 py-3 rounded-xl text-sm font-bold text-white">
               {publishing ? "در حال انتشار..." : "🚀 تایید نهایی و انتشار"}
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
