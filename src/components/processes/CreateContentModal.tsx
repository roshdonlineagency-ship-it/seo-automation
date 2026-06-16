"use client";

import { useEffect, useState } from "react";

// --- ۱. اینترفیس‌های ساختار داده پروژه ---
interface Section {
  id: string;
  h2: string;
  content: string;
  needs_image: boolean;
  image_priority: string;
  image_suggestion: string;
}

interface ArticleData {
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  slug: string;
  h1: string;
  intro: string;
  sections: Section[];
  faq: { question: string; answer: string }[];
  conclusion: string;
  cta: { text: string; anchor_text: string; target_url: string };
}

interface ImageIdeaSet {
  sectionId: string;
  heading: string;
  ideas: string[];
  selectedIdea: string;
  customIdea: string;
  generatedPrompt: string;
  fileName: string;
  altText: string;
  file?: File;
}

interface Prompt {
  id: number;
  name: string;
  text: string;
}

interface Props {
  projectId: number;
  onClose: () => void;
}

// --- ۲. اینترفیس پراپ‌های بلاک متنی مستقل ---
interface ContentBlockProps {
  label: string;
  value: string;
  fieldKey: string;
  corrections: Record<string, string>;
  setCorrections: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  userWantsImage: Record<string, boolean>;
  setUserWantsImage: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

// --- ۳. کامپوننت کمکی بلاک متنی (خارج از بدنه اصلی جهت حفظ فوکوس کیبورد) ---
const ContentBlock = ({ 
  label, 
  value, 
  fieldKey, 
  corrections, 
  setCorrections, 
  userWantsImage, 
  setUserWantsImage 
}: ContentBlockProps) => (
  <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4 transition-colors hover:border-white/20">
    <div className="flex justify-between items-center">
      <span className="text-violet-400 text-xs font-bold bg-violet-500/10 px-3 py-1 rounded-full">{label}</span>
      <label className="flex items-center gap-2 cursor-pointer text-xs text-white/60 select-none">
        <input 
          type="checkbox" 
          checked={!!userWantsImage[fieldKey]} 
          onChange={(e) => setUserWantsImage((prev) => ({ ...prev, [fieldKey]: e.target.checked }))}
          className="rounded border-white/20 bg-transparent text-violet-600 focus:ring-violet-500 w-4 h-4"
        />
        نیاز به تصویر در این بخش
      </label>
    </div>
    
    <div className="text-sm text-white/80 leading-7 bg-black/20 p-3 rounded-xl border border-white/5 whitespace-pre-wrap">
      {value}
    </div>

    <input
      type="text"
      value={corrections[fieldKey] || ""}
      onChange={(e) => setCorrections((prev) => ({ ...prev, [fieldKey]: e.target.value }))}
      placeholder="یادداشت یا نکته اصلاحی سردبیری برای این بخش..."
      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500 transition-colors"
    />
  </div>
);

// --- ۴. کامپوننت اصلی مدیریت میز تحریریه ---
export default function CreateContentModal({ projectId, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState("");
  const [targetPage, setTargetPage] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  
  // نگهداری آیدی هر ۵ پرامپت استراتژیک
  const [pIds, setPIds] = useState({
    gen: "",   // ۱. پرامپت تولید محتوا
    rev: "",   // ۲. پرامپت اصلاحیه
    idea: "",  // ۳. پرامپت ایده تصویر
    draw: "",  // ۴. پرامپت ساخت تصویر
    meta: ""   // ۵. پرامپت سئو و دیتای تصویر
  });
  
  const [loading, setLoading] = useState(true);
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [userWantsImage, setUserWantsImage] = useState<Record<string, boolean>>({});
  
  const [pastedJson, setPastedJson] = useState("");
  const [compiledCorrectionPrompt, setCompiledCorrectionPrompt] = useState("");
  const [isWaitingForCorrection, setIsWaitingForCorrection] = useState(false);
  const [correctionPastedJson, setCorrectionPastedJson] = useState("");

  // مدیریت استیت‌های بخش تصاویر (مرحله ۴)
  const [imageAssets, setImageAssets] = useState<Record<string, ImageIdeaSet>>({});
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState("");

  useEffect(() => {
    if (projectId) loadPrompts();
  }, [projectId]);

  async function loadPrompts() {
    try {
      setLoading(true);
      const res = await fetch(`/api/prompts?projectId=${Number(projectId)}`);
      const data = await res.json();
      if (Array.isArray(data)) setPrompts(data);
    } catch (err) {
      console.error("Error loading prompts:", err);
    } finally {
      setLoading(false);
    }
  }

  // تمیزکننده و پارسر ساختار JSON هوش مصنوعی
  const cleanAndParseJson = (rawContent: string) => {
    let clean = rawContent.trim();
    if (clean.includes("```json")) {
      clean = clean.split("```json")[1].split("```")[0].trim();
    } else if (clean.includes("```")) {
      clean = clean.split("```")[1].split("```")[0].trim();
    }
    return JSON.parse(clean);
  };

  const getFinalGenerationPrompt = () => {
    const genPrompt = prompts.find((p) => p.id === Number(pIds.gen));
    if (!genPrompt) return "";
    return `${genPrompt.text}\n\nموضوع مقاله:\n${topic}\n\nصفحه هدف برای لینک سازی:\n${targetPage}`;
  };

  const handleParseInitialJson = () => {
    try {
      const parsedData = cleanAndParseJson(pastedJson);
      setArticleData(parsedData);
      
      const imageToggles: Record<string, boolean> = {};
      // مقداردهی پیش‌فرض تیک تصاویر از فایل JSON دریافتی
      imageToggles["h1"] = false;
      imageToggles["intro"] = parsedData.intro ? true : false;
      parsedData.sections?.forEach((sec: any) => {
        imageToggles[sec.id] = sec.needs_image;
      });
      imageToggles["conclusion"] = false;

      setUserWantsImage(imageToggles);
      setStep(3); 
    } catch (error) {
      alert("ساختار کلیدهای محتوای JSON نامعتبر است. فرمت خروجی را بررسی کنید.");
    }
  };

  const handleGenerateCorrectionPrompt = () => {
    if (!articleData) return;
    const revPrompt = prompts.find((p) => p.id === Number(pIds.rev));
    if (!revPrompt) {
      alert("لطفا پرامپت اصلاحیه را از تنظیمات مرحله اول انتخاب کنید.");
      return;
    }

    const reviewReport = {
      meta_title: corrections["meta_title"] || "تایید شده (عینا تکرار شود)",
      meta_description: corrections["meta_description"] || "تایید شده (عینا تکرار شود)",
      slug: corrections["slug"] || "تایید شده (عینا تکرار شود)",
      h1: corrections["h1"] || "تایید شده (عینا تکرار شود)",
      intro: corrections["intro"] || "تایید شده (عینا تکرار شود)",
      conclusion: corrections["conclusion"] || "تایید شده (عینا تکرار شود)",
      sections: articleData.sections?.map(sec => ({
        id: sec.id,
        status: corrections[sec.id] || "تایید شده (عینا تکرار شود)"
      }))
    };

    const finalCorrectionText = `
${revPrompt.text}

دیتای فعلی مقاله (فرمت JSON):
${JSON.stringify(articleData, null, 2)}

گزارش نظرات و اصلاحات جدید کاربر جهت اعمال تغییرات:
${JSON.stringify(reviewReport, null, 2)}
`;

    setCompiledCorrectionPrompt(finalCorrectionText.trim());
    setIsWaitingForCorrection(true);
  };

  const handleApplyCorrectionJson = () => {
    try {
      const parsedData = cleanAndParseJson(correctionPastedJson);
      setArticleData(parsedData);
      setCorrections({});
      setCorrectionPastedJson("");
      setIsWaitingForCorrection(false);
    } catch (error) {
      alert("ساختار فیلدهای اصلاح‌شده با قالب JSON سیستم همخوانی ندارد.");
    }
  };

  // --- ۵. توابع پیشرفته مدیریت و هوشمندسازی فرآیند تصاویر (مرحله ۴) ---
// مرحله ۴: تولید ۳ ایده تصویر با Groq (نسخه بهینه، همزمان و ضد قفل)
  const generateImageIdeas = async () => {
    setStep(4);
    setIsGeneratingIdeas(true);
    
    try {
      const ideaPrompt = prompts.find(p => p.id === Number(pIds.idea))?.text;
      const newAssets: Record<string, ImageIdeaSet> = {};
      
      // فیلتر کردن سکشن‌هایی که تیک نیاز به تصویر دارند
      const activeKeys = Object.keys(userWantsImage).filter(key => userWantsImage[key]);
      
      // اجرای همزمان تمام درخواست‌ها برای سرعت فوق‌العاده و جلوگیری از معطلی
      await Promise.all(
        activeKeys.map(async (key) => {
          let heading = "";
          let content = "";

          if (key === "h1") { heading = "تیتر اصلی مقاله (H1)"; content = articleData?.h1 || ""; }
          else if (key === "intro") { heading = "مقدمه مقاله"; content = articleData?.intro || ""; }
          else if (key === "conclusion") { heading = "نتیجه‌گیری انتها"; content = articleData?.conclusion || ""; }
          else {
            const sec = articleData?.sections.find(s => s.id === key);
            if (sec) { heading = `سکشن: ${sec.h2}`; content = sec.content; }
          }

          try {
            const res = await fetch("/api/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                model: "groq", 
                prompt: `${ideaPrompt}\n\nمحتوای متنی بخش مربوطه:\n${content}` 
              })
            });
            
            if (!res.ok) throw new Error(`API Status: ${res.status}`);
            
            const data = await res.json();
            const parsedJson = cleanAndParseJson(data.content);
            const ideas = parsedJson.ideas || ["خطا در دریافت ایده اول", "ایده دوم", "ایده سوم"];

            newAssets[key] = { 
              sectionId: key, 
              heading,
              ideas, 
              selectedIdea: ideas[0] || "", 
              customIdea: "", 
              generatedPrompt: "", 
              fileName: "", 
              altText: "" 
            };
          } catch (e) { 
            console.error(`Error generating image ideas for key [${key}]:`, e); 
            // فال‌بک امن برای اینکه لودر قفل نکند و سیستم به کارش ادامه دهد
            newAssets[key] = { 
              sectionId: key, 
              heading,
              ideas: ["امکان دریافت خودکار ایده فراهم نشد"], 
              selectedIdea: "", 
              customIdea: "", 
              generatedPrompt: "", 
              fileName: "image.jpg", 
              altText: "تصویر مقاله" 
            };
          }
        })
      );

      setImageAssets(newAssets);
    } catch (globalError) {
      console.error("Global error in generateImageIdeas:", globalError);
      alert("خطایی در سیستم فرآیند ایده‌پردازی رخ داد.");
    } finally {
      // این بلوک تضمین می‌کند که انیمیشن لودینگ تحت هر شرایطی حتماً خاموش شود
      setIsGeneratingIdeas(false);
    }
  };

  const finalizeImageAssets = async (key: string) => {
    const asset = imageAssets[key];
    const finalIdea = asset.customIdea || asset.selectedIdea;
    const drawPromptBase = prompts.find(p => p.id === Number(pIds.draw))?.text;
    const metaPromptBase = prompts.find(p => p.id === Number(pIds.meta))?.text;

    try {
      // الف) دریافت پرامپت تخصصی رندر یا ابزارهای تصویرسازی به صورت JSON
      const resDraw = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "groq", prompt: `${drawPromptBase}\n\nایده محوری برای توسعه پرامپت: ${finalIdea}` })
      });
      const drawData = await resDraw.json();
      const parsedDraw = cleanAndParseJson(drawData.content);

      // ب) دریافت ساختار اطلاعات نام فایل و متن جایگزین تصویر به صورت JSON
      const resMeta = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "groq", prompt: `${metaPromptBase}\n\nایده نهایی برای سئو تصویر: ${finalIdea}` })
      });
      const metaData = await resMeta.json();
      const parsedMeta = cleanAndParseJson(metaData.content);

      setImageAssets(prev => ({
        ...prev,
        [key]: { 
          ...prev[key], 
          generatedPrompt: parsedDraw.image_prompt || "", 
          fileName: parsedMeta.filename || "perfume-image.jpg", 
          altText: parsedMeta.alt_text || "تصویر مرتبط با محتوای سایت" 
        }
      }));
    } catch (e) { 
      alert("خطا در ایجاد پرامپت یا ساختار سئو تصاویر. اتصال شبکه را بررسی کنید."); 
    }
  };

  // --- ۶. فرآیند نهایی آپلود تصاویر در هسته وردپرس و انتشار بریف مقاله ---
  const handleFinalPublish = async () => {
    if (!articleData) return;
    setPublishing(true);
    try {
      const mediaMap: Record<string, string> = {};

      // آپلود فایل‌های فیزیکی انتخاب شده در رسانه وردپرس
      for (const key of Object.keys(imageAssets)) {
        const asset = imageAssets[key];
        if (asset.file) {
          const formData = new FormData();
          // تغییر نام فایل بر اساس نام ویرایش‌شده توسط کاربر پیش از آپلود
          const blob = asset.file.slice(0, asset.file.size, asset.file.type);
          const renamedFile = new File([blob], asset.fileName || "image.jpg", { type: asset.file.type });

          formData.append("file", renamedFile);
          formData.append("title", asset.altText);
          formData.append("alt_text", asset.altText);
          
          const uploadRes = await fetch("/api/wordpress/media", { method: "POST", body: formData });
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            mediaMap[key] = uploadData.url;
          }
        }
      }

      // تزریق تصاویر آپلود شده به صورت المان‌های بومی HTML زیر پاراگراف‌های مقاله
      let html = `<p><strong>کلمه کلیدی هدف:</strong> ${articleData.focus_keyword}</p>`;
      
      if (mediaMap["h1"]) {
        html += `<p style="text-align:center;"><img src="${mediaMap["h1"]}" alt="${imageAssets["h1"].altText}" /></p>`;
      }

      html += `<p>${articleData.intro}</p>`;
      if (mediaMap["intro"]) {
        html += `<p style="text-align:center;"><img src="${mediaMap["intro"]}" alt="${imageAssets["intro"].altText}" /></p>`;
      }

      articleData.sections?.forEach((sec) => {
        html += `<h2>${sec.h2}</h2>`;
        html += `<p>${sec.content}</p>`;
        if (mediaMap[sec.id]) {
          html += `<p style="text-align:center;"><img src="${mediaMap[sec.id]}" alt="${imageAssets[sec.id].altText}" /></p>`;
        }
      });

      if (articleData.faq && articleData.faq.length > 0) {
        html += `<h2>سوالات متداول کاربران</h2>`;
        articleData.faq.forEach((item) => {
          html += `<h3>${item.question}</h3>`;
          html += `<p>${item.answer}</p>`;
        });
      }

      html += `<h2>جمع‌بندی نهایی</h2><p>${articleData.conclusion}</p>`;
      if (mediaMap["conclusion"]) {
        html += `<p style="text-align:center;"><img src="${mediaMap["conclusion"]}" alt="${imageAssets["conclusion"].altText}" /></p>`;
      }

      if (articleData.cta) {
        html += `<div style="padding:24px; background:#1a1a1a; color:#ffffff; border-radius:16px; border:1px solid #333; margin-top:24px;">`;
        html += `<h4 style="margin:0 0 8px 0; font-size:16px;">${articleData.cta.text}</h4>`;
        html += `<p style="margin:0;"><a href="${articleData.cta.target_url}" style="color:#a78bfa; text-decoration:underline; font-weight:bold;">${articleData.cta.anchor_text}</a></p>`;
        html += `</div>`;
      }

      // ارسال پکیج نهایی مقاله به سیستم وردپرس
      const res = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: articleData.h1 || topic, 
          content: html,
          slug: articleData.slug,
          excerpt: articleData.meta_description
        }),
      });
      const finalRes = await res.json();
      if (finalRes.success) {
        setPublished(finalRes.link);
      }
    } catch (err) {
      console.error(err);
      alert("خطا در انتشار محتوا یا بارگذاری رسانه‌ها به هسته وب‌سایت.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 text-white" dir="rtl">
      <div className="w-full max-w-5xl bg-[#0f0f0f] border border-white/10 rounded-3xl overflow-hidden max-h-[92vh] flex flex-col shadow-2xl">

        {/* بخش هدر پنجره مدال */}
        <div className="border-b border-white/10 px-6 py-5 flex items-center justify-between bg-black/20">
          <div>
            <span className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider">Automated Content Factory</span>
            <h3 className="font-bold text-lg text-white">میز فرمولاسیون و تدوین ساختار بریف محتوا</h3>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`w-2 h-2 rounded-full transition-all duration-300 ${step === s ? "bg-violet-500 scale-125 shadow-lg shadow-violet-500/50" : step > s ? "bg-violet-800" : "bg-white/10"}`} />
            ))}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-red-400 transition-colors text-lg">✕</button>
        </div>

        {/* بدنه محتوای استپ‌ها */}
        <div className="p-6 overflow-y-auto flex-1 solution-scroll">

          {/* مرحله ۱ — فرم اطلاعات پایه و تخصیص ۵ پرامپت اختصاصی دیتابیس */}
          {step === 1 && (
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
                <div className="text-sm text-white/30 animate-pulse text-center py-6">در حال فراخوانی الگوی پرامپت‌های استراتژیک از دیتابیس...</div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-violet-400 font-semibold border-r-2 border-violet-500 pr-2 my-2">تخصیص ماتریس پرامپت‌های ۵گانه سیستم</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-white/40 text-[11px] mb-1.5">۱. پرامپت تولید ساختار بریف:</label>
                      <select value={pIds.gen} onChange={e => setPIds(p => ({...p, gen: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-violet-500">
                        <option value="" className="bg-[#111]">انتخاب پرامپت</option>
                        {prompts.map((p) => <option key={p.id} value={p.id} className="bg-[#111]">{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/40 text-[11px] mb-1.5">۲. پرامپت بازنویسی سردبیری:</label>
                      <select value={pIds.rev} onChange={e => setPIds(p => ({...p, rev: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-violet-500">
                        <option value="" className="bg-[#111]">انتخاب پرامپت</option>
                        {prompts.map((p) => <option key={p.id} value={p.id} className="bg-[#111]">{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/40 text-[11px] mb-1.5">۳. پرامپت ایده‌پردازی عکس:</label>
                      <select value={pIds.idea} onChange={e => setPIds(p => ({...p, idea: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-violet-500">
                        <option value="" className="bg-[#111]">انتخاب پرامپت</option>
                        {prompts.map((p) => <option key={p.id} value={p.id} className="bg-[#111]">{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/40 text-[11px] mb-1.5">۴. پرامپت مهندسی تصویرسازی:</label>
                      <select value={pIds.draw} onChange={e => setPIds(p => ({...p, draw: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-violet-500">
                        <option value="" className="bg-[#111]">انتخاب پرامپت</option>
                        {prompts.map((p) => <option key={p.id} value={p.id} className="bg-[#111]">{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/40 text-[11px] mb-1.5">۵. پرامپت فاکتورهای سئو تصویر:</label>
                      <select value={pIds.meta} onChange={e => setPIds(p => ({...p, meta: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-violet-500">
                        <option value="" className="bg-[#111]">انتخاب پرامپت</option>
                        {prompts.map((p) => <option key={p.id} value={p.id} className="bg-[#111]">{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!topic || !targetPage || !pIds.gen || !pIds.rev || !pIds.idea || !pIds.draw || !pIds.meta}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 py-3.5 rounded-xl text-sm font-bold transition-all text-white mt-4 shadow-lg shadow-violet-600/20"
              >
                تولید ماتریس و گام بعدی پرامپت کلاود ←
              </button>
            </div>
          )}

          {/* مرحله ۲ — کپی بریف اولیه و رندر باکس تکی دریافت JSON */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl">
                <p className="text-amber-400 text-xs mb-2 font-bold flex items-center gap-2">📑 گام اول: الگو را کپی و در پلتفرم چت هوش مصنوعی بزرگ پیست کنید:</p>
                <div className="relative">
                  <textarea
                    readOnly
                    value={getFinalGenerationPrompt()}
                    className="w-full h-36 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white/70 font-mono focus:outline-none resize-none leading-6"
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(getFinalGenerationPrompt());
                      alert("دیتا کامپایل و کپی شد!");
                    }}
                    className="absolute bottom-3 left-3 bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] px-3 py-1.5 rounded-lg border border-white/5"
                  >
                    📋 کپی متن پرامپت ساختاریافته
                  </button>
                </div>
              </div>

              <div>
                <p className="text-emerald-400 text-xs mb-2 font-bold flex items-center gap-2">📥 گام دوم: ساختار دیتای کامل JSON دریافتی را در کادر زیر قرار دهید:</p>
                <textarea
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder="کل آبجکت فرمت { ... } را بدون مقدمه‌چینی متنی در این کادر پیست کنید..."
                  className="w-full h-44 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm text-white font-medium hover:bg-white/10 transition-colors">اصلاح مقادیر ورودی</button>
                <button 
                  onClick={handleParseInitialJson}
                  disabled={!pastedJson}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-colors"
                >
                  تحلیل دیتا و ورود به میز سردبیری تحریریه 🧠
                </button>
              </div>
            </div>
          )}

          {/* مرحله ۳ — میز تحریریه پیشرفته مستقل */}
          {step === 3 && articleData && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ContentBlock label="متا تایتل سئو (Meta Title)" value={articleData.meta_title} fieldKey="meta_title" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />
                <ContentBlock label="متا دیسکریپشن (Meta Description)" value={articleData.meta_description} fieldKey="meta_description" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ContentBlock label="کلمه کلیدی تمرکزی" value={articleData.focus_keyword} fieldKey="focus_keyword" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />
                <ContentBlock label="نامک آدرس (Slug)" value={articleData.slug} fieldKey="slug" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />
              </div>

              <ContentBlock label="عنوان اصلی مقاله (H1)" value={articleData.h1} fieldKey="h1" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />
              <ContentBlock label="مقدمه شروع مقاله (Introduction)" value={articleData.intro} fieldKey="intro" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />

              <div className="space-y-4">
                <p className="text-white/40 text-xs border-r-2 border-violet-500 pr-2 font-bold">بخش هدینگ‌ها و بدنه سکشن‌های مقاله</p>
                {articleData.sections?.map((sec) => (
                  <ContentBlock 
                    key={sec.id}
                    label={`سرفصل دوم (H2): ${sec.h2}`} 
                    fieldKey={sec.id} 
                    value={sec.content}
                    corrections={corrections}
                    setCorrections={setCorrections}
                    userWantsImage={userWantsImage}
                    setUserWantsImage={setUserWantsImage}
                  />
                ))}
              </div>

              <ContentBlock label="پاراگراف خلاصه و جمع‌بندی" value={articleData.conclusion} fieldKey="conclusion" corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} />

              {/* باکس تعاملی ساخت پرامپت اصلاحات در صورت نیاز به رندر مجدد */}
              {isWaitingForCorrection && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl space-y-4 my-6">
                  <div className="flex justify-between items-center">
                    <p className="text-amber-400 text-xs font-semibold">🛠️ دیتای گزارش اصلاحات کامپایل شد! آن را کپی کرده و به مدل زبانی تحویل دهید:</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(compiledCorrectionPrompt);
                        alert("پرامپت اصلاحیه کپی شد!");
                      }}
                      className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-3 py-1 rounded-lg"
                    >
                      📋 کپی پرامپت اصلاحیه
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={compiledCorrectionPrompt}
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white/70 font-mono focus:outline-none"
                  />
                  <div>
                    <p className="text-emerald-400 text-xs font-semibold mb-2">📥 خروجی کل JSON اصلاح‌شده جدید را اینجا قرار دهید:</p>
                    <textarea
                      value={correctionPastedJson}
                      onChange={(e) => setCorrectionPastedJson(e.target.value)}
                      placeholder="کل آبجکت اصلاح‌شده را بدون توضیحات اضافه پیست کنید..."
                      className="w-full h-32 bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setIsWaitingForCorrection(false)} className="text-white/40 hover:text-white text-xs px-4 py-2 rounded-xl">انصراف</button>
                    <button 
                      onClick={handleApplyCorrectionJson}
                      disabled={!correctionPastedJson}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-5 py-2 rounded-xl font-medium"
                    >
                      🔄 بروزرسانی میز تحریریه
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-white/10 pt-5 flex flex-wrap gap-3">
                <button 
                  onClick={handleGenerateCorrectionPrompt}
                  className="bg-amber-600 hover:bg-amber-500 px-5 py-3.5 rounded-xl text-sm font-medium text-white flex-1 min-w-[180px] transition-colors"
                >
                  ⚙️ ساخت پرامپت اصلاحیه سردبیری
                </button>

                <button
                  onClick={generateImageIdeas}
                  className="bg-violet-600 hover:bg-violet-500 px-5 py-3.5 rounded-xl text-sm font-bold text-white flex-1 min-w-[220px] shadow-lg shadow-violet-600/20 transition-all"
                >
                  گام بعد: مدیریت و استودیو تصاویر هوشمند ✨
                </button>
              </div>
            </div>
          )}

          {/* مرحله ۴ — استودیو مدیریت تصاویر با اتصال Groq (فرمت متقن JSON) */}
          {step === 4 && (
            <div className="space-y-6">
              {isGeneratingIdeas ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-white/50 animate-pulse font-medium">در حال واکشی اطلاعات، تحلیل متن و استخراج ۳ ایده خلاقانه بر پایه هوش مصنوعی Groq...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-violet-500/5 border border-violet-500/20 p-4 rounded-xl">
                    <h4 className="text-sm font-bold text-violet-400">🎨 استودیو فرمولاسیون و بهینه‌سازی تصاویر</h4>
                    <p className="text-xs text-white/50 mt-1">بخش‌هایی که تیک نیاز به تصویر آن‌ها فعال بوده است در زیر فهرست شده‌اند. برای هر بخش ایده را انتخاب یا بنویسید، پرامپت و دیتای سئو را به صورت خودکار بسازید.</p>
                  </div>

                  {Object.keys(imageAssets).length === 0 ? (
                    <div className="text-center py-10 text-white/30 text-xs">هیچ سکشنی برای درج تصویر انتخاب نشده است. می‌توانید به گام قبل بازگردید یا مستقیما منتشر کنید.</div>
                  ) : (
                    Object.keys(imageAssets).map((key) => {
                      const asset = imageAssets[key];
                      return (
                        <div key={key} className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4 transition-colors hover:border-white/20">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <h5 className="text-xs font-bold text-violet-400">{asset.heading}</h5>
                            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/40">Section ID: {key}</span>
                          </div>

                          {/* نمایش ۳ ایده خروجی Groq */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] text-white/40 block">یکی از ۳ ایده پیشنهادی هوش مصنوعی را انتخاب کنید:</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {asset.ideas.map((idea) => (
                                <button
                                  key={idea}
                                  type="button"
                                  onClick={() => setImageAssets(prev => ({
                                    ...prev,
                                    [key]: { ...prev[key], selectedIdea: idea }
                                  }))}
                                  className={`p-3 rounded-xl text-xs text-right border transition-all duration-200 ${asset.selectedIdea === idea && !asset.customIdea ? "border-violet-500 bg-violet-500/10 text-white font-medium" : "border-white/5 bg-black/20 text-white/60 hover:border-white/10"}`}
                                >
                                  {idea}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* فیلد ایده شخصی یا ویرایش سفارشی */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] text-white/40 block">یا کادر زیر را پر کنید (نوشتن در این کادر اولویت قرار می‌گیرد):</label>
                            <input 
                              type="text"
                              placeholder="ایده بصری سفارشی خودتان را بنویسید یا ترکیب کنید..."
                              value={asset.customIdea}
                              onChange={(e) => setImageAssets(prev => ({
                                ...prev,
                                [key]: { ...prev[key], customIdea: e.target.value }
                              }))}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500"
                            />
                          </div>

                          <div className="flex justify-start">
                            <button
                              type="button"
                              onClick={() => finalizeImageAssets(key)}
                              className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-4 py-2 rounded-xl border border-white/5 font-medium transition-colors"
                            >
                              ⚙️ تولید پرامپت رندر و متادیتای سئو (JSON API)
                            </button>
                          </div>

                          {/* رندر فیلدهای واکشی شده پرامپت و نام فایل/الت */}
                          {asset.generatedPrompt && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 mt-2 border-t border-white/5 bg-black/30 p-4 rounded-xl border border-white/5">
                              <div className="space-y-2">
                                <span className="text-[11px] text-violet-400 font-bold block">🤖 پرامپت تخصصی تصویرسازی (Midjourney / DALL-E):</span>
                                <textarea 
                                  readOnly 
                                  value={asset.generatedPrompt} 
                                  className="w-full h-24 bg-black/50 text-[11px] font-mono p-2.5 rounded-lg border border-white/5 text-white/80 resize-none focus:outline-none"
                                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                                />
                                <span className="text-[10px] text-white/30 block">برای کپی کردن روی باکس پرامپت فوق کلیک کنید.</span>
                              </div>

                              <div className="space-y-3">
                                <span className="text-[11px] text-emerald-400 font-bold block">⚙️ فاکتورهای بهینه‌سازی و سئوی تصویر:</span>
                                
                                <div className="space-y-1">
                                  <label className="text-[10px] text-white/40">نام فایل تصویر (قابل ویرایش):</label>
                                  <input 
                                    type="text" 
                                    value={asset.fileName}
                                    onChange={(e) => setImageAssets(prev => ({
                                      ...prev,
                                      [key]: { ...prev[key], fileName: e.target.value }
                                    }))}
                                    className="w-full bg-black/40 border border-white/10 p-2 rounded-lg text-xs font-mono text-white"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] text-white/40">متن جایگزین تصویر (Alt Text):</label>
                                  <input 
                                    type="text" 
                                    value={asset.altText}
                                    onChange={(e) => setImageAssets(prev => ({
                                      ...prev,
                                      [key]: { ...prev[key], altText: e.target.value }
                                    }))}
                                    className="w-full bg-black/40 border border-white/10 p-2 rounded-lg text-xs text-white"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] text-white/40 block">بارگذاری فایل تصویر تولید شده:</label>
                                  <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => {
                                      const selectedFile = e.target.files?.[0];
                                      if (selectedFile) {
                                        setImageAssets(prev => ({ ...prev, [key]: { ...prev[key], file: selectedFile } }));
                                      }
                                    }}
                                    className="text-xs text-white/50 file:bg-zinc-800 file:text-white file:border-0 file:px-3 file:py-1.5 file:rounded-lg file:ml-3 file:cursor-pointer hover:file:bg-zinc-700" 
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              <div className="border-t border-white/10 pt-5 flex gap-3">
                <button 
                  onClick={() => setStep(3)} 
                  className="bg-white/5 border border-white/10 px-6 py-3.5 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-colors"
                >
                  بازگشت به محتوا
                </button>
                <button
                  onClick={handleFinalPublish}
                  disabled={publishing}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 py-3.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all text-center"
                >
                  {publishing ? "در حال پردازش، بارگذاری رسانه‌ها و انتشار..." : "اتمام فرآیند و درج تصویرمحور در وردپرس 🚀"}
                </button>
              </div>

              {published && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-center">
                  <p className="text-emerald-400 text-sm font-medium mb-1">🎉 بریف مقاله شما با موفقیت به همراه تمامی تصاویر پیوست و سئو شده در وردپرس درج شد!</p>
                  <a href={published} target="_blank" rel="noopener noreferrer" className="text-white text-xs underline font-bold hover:text-violet-400 transition-colors">📦 مشاهده لینک زنده مقاله منتشر شده روی وب‌سایت</a>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
