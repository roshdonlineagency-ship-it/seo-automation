"use client";

import { useEffect, useState } from "react";

// --- اینترفیس‌های ساختار محتوای بریف ---
interface Section {
  id: string;
  h2: string;
  content: string;
  needs_image: boolean;
  image_priority: "High" | "Medium" | "Low";
  image_suggestion: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface ArticleData {
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  slug: string;
  h1: string;
  intro: string;
  sections: Section[];
  faq: FAQ[];
  conclusion: string;
  cta: {
    text: string;
    anchor_text: string;
    target_url: string;
  };
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

export default function CreateContentModal({ projectId, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState("");
  const [targetPage, setTargetPage] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  
  // استیت انتخاب دو پرامپت مجزا
  const [selectedGenPromptId, setSelectedGenPromptId] = useState("");
  const [selectedRevPromptId, setSelectedRevPromptId] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<string>("");

  // استیت‌های مدیریت محتوای متنی پیست شده و تولید شده
  const [pastedJson, setPastedJson] = useState("");
  const [correctionPastedJson, setCorrectionPastedJson] = useState("");
  const [compiledCorrectionPrompt, setCompiledCorrectionPrompt] = useState("");
  const [isWaitingForCorrection, setIsWaitingForCorrection] = useState(false);

  // --- استیت‌های مدیریت ساختار بریف ---
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [approvedFields, setApprovedFields] = useState<Record<string, boolean>>({});
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [userWantsImage, setUserWantsImage] = useState<Record<string, boolean>>({});
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    loadPrompts();
  }, [projectId]);

  async function loadPrompts() {
    try {
      setLoading(true);
      const res = await fetch(`/api/prompts?projectId=${Number(projectId)}`);
      const data = await res.json();
      if (Array.isArray(data)) setPrompts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // تمیزکننده بلاک‌های کد مارک‌داون (اگر کاربر جیسان را با ```json کپی کرده باشد)
  const cleanAndParseJson = (rawContent: string) => {
    let clean = rawContent.trim();
    if (clean.includes("```json")) {
      clean = clean.split("```json")[1].split("```")[0].trim();
    } else if (clean.includes("```")) {
      clean = clean.split("```")[1].split("```")[0].trim();
    }
    return JSON.parse(clean);
  };

  // مرحله ۱: ادغام اطلاعات با پرامپت تولید اولیه
  const getFinalGenerationPrompt = () => {
    const genPrompt = prompts.find((p) => p.id === Number(selectedGenPromptId));
    if (!genPrompt) return "";
    return `${genPrompt.text}\n\nموضوع مقاله:\n${topic}\n\nصفحه هدف برای لینک سازی:\n${targetPage}\n\nنکته فوق حیاتی: خروجی تو باید "فقط و فقط" یک فرمت JSON معتبر و منطبق بر ساختار خواسته شده باشد. هیچ کلام، تگ یا توضیحی خارج از آبجکت اصلی JSON ارسال نکن.`;
  };

  // پردازش جیسان اولیه وارد شده توسط کاربر
  const handleParseInitialJson = () => {
    setJsonError(null);
    try {
      const parsedData = cleanAndParseJson(pastedJson);
      setArticleData(parsedData);
      
      // پیش‌فرض تایید تصاویر بر اساس پیشنهاد هوش مصنوعی
      const imageToggles: Record<string, boolean> = {};
      parsedData.sections?.forEach((sec: any) => {
        imageToggles[sec.id] = sec.needs_image;
      });
      setUserWantsImage(imageToggles);
      
      setStep(3); // ورود به میز تحریریه
    } catch (error) {
      console.error(error);
      setJsonError("خطا در ساختار JSON! مطمئن شوید که تمام متن ساختار معتبر دارد و کاراکتر اضافی ندارد.");
    }
  };

  // مرحله ۳: ساخت پرامپت اصلاحیه برای کپی دستی کاربر
  const handleGenerateCorrectionPrompt = () => {
    if (!articleData) return;
    const revPrompt = prompts.find((p) => p.id === Number(selectedRevPromptId));
    if (!revPrompt) {
      alert("لطفا ابتدا پرامپت اصلاحیه را از تنظیمات مرحله اول انتخاب کنید.");
      return;
    }

    // اصلاح کامل خطای سینتکسی کوتیشن‌ها در آبجکت پایین
    const reviewReport = {
      meta_title: approvedFields["meta_title"] ? "تایید شده (عینا تکرار شود)" : (corrections["meta_title"] || "بدون تغییر"),
      meta_description: approvedFields["meta_description"] ? "تایید شده (عینا تکرار شود)" : (corrections["meta_description"] || "بدون تغییر"),
      slug: approvedFields["slug"] ? "تایید شده (عینا تکرار شود)" : (corrections["slug"] || "بدون تغییر"),
      h1: approvedFields["h1"] ? "تایید شده (عینا تکرار شود)" : (corrections["h1"] || "بدون تغییر"),
      intro: approvedFields["intro"] ? "تایید شده (عینا تکرار شود)" : (corrections["intro"] || "بدون تغییر"),
      conclusion: approvedFields["conclusion"] ? "تایید شده (عینا تکرار شود)" : (corrections["conclusion"] || "بدون تغییر"),
      sections: articleData.sections?.map(sec => ({
        id: sec.id,
        status: approvedFields[sec.id] ? "تایید شده (عینا تکرار شود)" : (corrections[sec.id] || "بدون تغییر")
      })),
      faq: articleData.faq?.map((f, index) => ({
        index,
        status: approvedFields[`faq_${index}`] ? "تایید شده (عینا تکرار شود)" : (corrections[`faq_${index}`] || "بدون تغییر")
      }))
    };

    const finalCorrectionText = `
${revPrompt.text}

دیتای فعلی مقاله (فرمت JSON):
${JSON.stringify(articleData, null, 2)}

گزارش نظرات، تاییدها و اصلاحات کاربر برای اعمال:
${JSON.stringify(reviewReport, null, 2)}

نکته فوق حیاتی: خروجی نهایی تو باید "فقط و فقط" ساختار کامل و به‌روزرسانی‌شده ی JSON قبلی باشد. هیچ توضیح یا مقدمه و موخره‌ای خارج از ساختار JSON ننویس.
`;

    setCompiledCorrectionPrompt(finalCorrectionText.trim());
    setIsWaitingForCorrection(true);
  };

  // اعمال جیسان اصلاح شده دستی کاربر به کامپوننت
  const handleApplyCorrectionJson = () => {
    setJsonError(null);
    try {
      const parsedData = cleanAndParseJson(correctionPastedJson);
      setArticleData(parsedData);
      
      // ریست کردن بخش اصلاحات
      setCorrections({});
      setCorrectionPastedJson("");
      setIsWaitingForCorrection(false);
    } catch (error) {
      console.error(error);
      setJsonError("ساختار JSON اصلاحیه نامعتبر است. لطفاً خروجی کامل هوش مصنوعی را مجدداً بررسی کنید.");
    }
  };

  // تبدیل دیتای نهایی به کدهای HTML تمیز جهت ارسال به وردپرس
  const convertJsonToHtml = (data: ArticleData) => {
    let html = `<p><strong>کلمه کلیدی تمرکزی:</strong> ${data.focus_keyword}</p>`;
    html += `<p>${data.intro}</p>`;
    
    data.sections?.forEach((sec) => {
      html += `<h2>${sec.h2}</h2>`;
      html += `<p>${sec.content}</p>`;
      if (userWantsImage[sec.id]) {
        html += `<p style="color: #7c3aed; font-style: italic;">[محل قرارگیری تصویر: ${sec.image_suggestion}]</p>`;
      }
    });

    if (data.faq && data.faq.length > 0) {
      html += `<h2>سوالات متداول</h2>`;
      data.faq.forEach((item) => {
        html += `<h3>${item.question}</h3>`;
        html += `<p>${item.answer}</p>`;
      });
    }

    html += `<h2>جمع‌بندی</h2><p>${data.conclusion}</p>`;
    if (data.cta) {
      html += `<div style="padding: 20px; background: #f3f4f6; border-radius: 8px; margin-top: 20px;">`;
      html += `<h4>${data.cta.text}</h4>`;
      html += `<p><a href="${data.cta.target_url}">${data.cta.anchor_text}</a></p>`;
      html += `</div>`;
    }
    return html;
  };

  const handlePublishToWordPress = async () => {
    if (!articleData) return;
    setPublishing(true);
    try {
      const formattedHtml = convertJsonToHtml(articleData);
      const res = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: articleData.h1 || topic, content: formattedHtml }),
      });
      const data = await res.json();
      if (data.success) {
        setPublished(data.link);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setPublish
