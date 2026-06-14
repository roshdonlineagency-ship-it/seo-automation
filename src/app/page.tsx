export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <nav className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-8 py-4">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">SEO Automation</h1>
      </nav>
      <main className="max-w-5xl mx-auto px-8 py-12">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">داشبورد سئو</h2>
        <p className="text-zinc-500 mb-10">ابزارهای اتوماسیون سئو شما</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">🔍 تحقیق کلمات کلیدی</h3>
            <p className="text-zinc-500 text-sm">پیدا کردن بهترین کلمات کلیدی برای سایتت</p>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">✍️ تولید محتوا</h3>
            <p className="text-zinc-500 text-sm">نوشتن محتوای سئو شده با هوش مصنوعی</p>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">📈 ردیابی رتبه</h3>
            <p className="text-zinc-500 text-sm">پیگیری رتبه سایتت در گوگل</p>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">🛠️ آدیت فنی</h3>
            <p className="text-zinc-500 text-sm">بررسی مشکلات فنی سئو سایت</p>
          </div>
        </div>
      </main>
    </div>
  );
}
