export default function Step1(props: any) {
  const { topic, setTopic, targetPage, setTargetPage, loading, prompts, pIds, setPIds, onNext } = props;

  const updatePId = (key: string, value: string) => {
    setPIds((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-white/40 font-medium">موضوع کلیدی محتوا:</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="موضوع مقاله را وارد کنید..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-white/40 font-medium">صفحه / لینک هدف تارگت:</label>
          <input
            type="text"
            value={targetPage}
            onChange={(e) => setTargetPage(e.target.value)}
            placeholder="لینک انکرتکست برای ارجاعات داخلی..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-white/30 animate-pulse text-center py-6">
          در حال فراخوانی الگوی پرامپت‌ها...
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-violet-400 font-semibold border-r-2 border-violet-500 pr-2 my-2">
            تخصیص ماتریس پرامپت‌های ۵گانه
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-white/40 text-[11px] mb-1.5">۱. ساختار بریف:</label>
              <select value={pIds.gen} onChange={(e) => updatePId("gen", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-violet-500">
                <option value="" className="bg-[#111]">انتخاب کنید</option>
                {prompts.map((p: any) => <option key={p.id} value={p.id} className="bg-[#111]">{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-white/40 text-[11px] mb-1.5">۲. بازبینی (Revision):</label>
              <select value={pIds.rev} onChange={(e) => updatePId("rev", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-violet-500">
                <option value="" className="bg-[#111]">انتخاب کنید</option>
                {prompts.map((p: any) => <option key={p.id} value={p.id} className="bg-[#111]">{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-white/40 text-[11px] mb-1.5">۳. ایده تصویر:</label>
              <select value={pIds.idea} onChange={(e) => updatePId("idea", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-violet-500">
                <option value="" className="bg-[#111]">انتخاب کنید</option>
                {prompts.map((p: any) => <option key={p.id} value={p.id} className="bg-[#111]">{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-white/40 text-[11px] mb-1.5">۴. ترسیم (Draw):</label>
              <select value={pIds.draw} onChange={(e) => updatePId("draw", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-violet-500">
                <option value="" className="bg-[#111]">انتخاب کنید</option>
                {prompts.map((p: any) => <option key={p.id} value={p.id} className="bg-[#111]">{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-white/40 text-[11px] mb-1.5">۵. متا سئو:</label>
              <select value={pIds.meta} onChange={(e) => updatePId("meta", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-violet-500">
                <option value="" className="bg-[#111]">انتخاب کنید</option>
                {prompts.map((p: any) => <option key={p.id} value={p.id} className="bg-[#111]">{p.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!topic || !targetPage || !pIds.gen || !pIds.rev || !pIds.idea || !pIds.draw || !pIds.meta}
        className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 py-3.5 rounded-xl text-sm font-bold transition-all text-white mt-4 shadow-lg shadow-violet-600/20"
      >
        تولید ماتریس و گام بعدی پرامپت کلاود ←
      </button>
    </div>
  );
}
