export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-violet-500 rounded-md"/>
          <span className="font-semibold tracking-tight">SEO.ai</span>
        </div>
        <button className="bg-violet-600 hover:bg-violet-500 transition-colors text-sm px-4 py-2 rounded-full">
          شروع کن
        </button>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-block bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs px-3 py-1 rounded-full mb-6">
          هوش مصنوعی + سئو
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-4 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
          سئو رو اتوماتیک کن
        </h1>
        <p className="text-white/40 text-lg mb-10">
          با هوش مصنوعی رتبه سایتت رو بالا ببر
        </p>
        <button className="bg-violet-600 hover:bg-violet-500 transition-colors px-8 py-3 rounded-full font-medium">
          رایگان شروع کن ←
        </button>
      </div>

      {/* Cards */}
      <div className="max-w-4xl mx-auto px-8 grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors">
          <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center text-xl mb-4">🔍</div>
          <h3 className="font-semibold mb-1">تحقیق کلمات کلیدی</h3>
          <p className="text-white/40 text-sm">بهترین کلمات رو پیدا کن</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors">
          <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center text-xl mb-4">✍️</div>
          <h3 className="font-semibold mb-1">تولید محتوا</h3>
          <p className="text-white/40 text-sm">محتوای سئو شده با AI</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors">
          <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center text-xl mb-4">📈</div>
          <h3 className="font-semibold mb-1">ردیابی رتبه</h3>
          <p className="text-white/40 text-sm">رتبه‌ات رو در گوگل ببین</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors">
          <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center text-xl mb-4">🛠️</div>
          <h3 className="font-semibold mb-1">آدیت فنی</h3>
          <p className="text-white/40 text-sm">مشکلات فنی سایتت رو حل کن</p>
        </div>
      </div>
    </div>
  );
}
