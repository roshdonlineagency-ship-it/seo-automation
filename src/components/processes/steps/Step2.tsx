export default function Step2(props: any) {
  const { getFinalGenerationPrompt, pastedJson, setPastedJson, handleParseInitialJson, setStep } = props;

  return (
    <div className="space-y-5">
      {/* بخش اول: کپی پرامپت */}
      <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl">
        <p className="text-amber-400 text-xs mb-2 font-bold flex items-center gap-2">
          📑 گام اول: الگو را کپی و در پلتفرم چت هوش مصنوعی بزرگ پیست کنید:
        </p>
        <div className="relative mt-3">
          <textarea
            readOnly
            dir="auto"
            value={getFinalGenerationPrompt()}
            className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white/80 font-mono focus:outline-none resize-none leading-relaxed whitespace-pre-wrap"
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />
          <button 
            onClick={() => {
              navigator.clipboard.writeText(getFinalGenerationPrompt());
              alert("دیتا کامپایل و کپی شد!");
            }}
            className="absolute bottom-4 left-4 bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] px-3 py-1.5 rounded-lg border border-white/5 transition-colors"
          >
            📋 کپی متن پرامپت ساختاریافته
          </button>
        </div>
      </div>

      {/* بخش دوم: وارد کردن JSON */}
      <div>
        <p className="text-emerald-400 text-xs mb-2 font-bold flex items-center gap-2">
          📥 گام دوم: ساختار دیتای کامل JSON دریافتی را در کادر زیر قرار دهید:
        </p>
        <textarea
          dir="ltr"
          value={pastedJson}
          onChange={(e) => setPastedJson(e.target.value)}
          placeholder="کل آبجکت فرمت { ... } را بدون مقدمه‌چینی متنی در این کادر پیست کنید..."
          className="w-full h-44 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-emerald-100/70 font-mono focus:outline-none focus:border-emerald-500/50 transition-colors text-left"
        />
      </div>

      {/* دکمه‌های کنترل */}
      <div className="flex gap-3 pt-2">
        <button 
          onClick={() => setStep(1)} 
          className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm text-white font-medium hover:bg-white/10 transition-colors"
        >
          اصلاح مقادیر ورودی
        </button>
        <button 
          onClick={handleParseInitialJson}
          disabled={!pastedJson}
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-colors"
        >
          تحلیل دیتا و ورود به میز سردبیری تحریریه 🧠
        </button>
      </div>
    </div>
  );
}
