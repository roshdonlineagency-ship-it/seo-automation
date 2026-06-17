"use client";

import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface Prompt {
  id: number;
  name: string;
  text: string;
}

interface Step3Props {
  articleData: ArticleData;
  corrections: Record<string, string>;
  setCorrections: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  userWantsImage: Record<string, boolean>;
  setUserWantsImage: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  prompts: Prompt[];
  revPromptId: string;
  isWaitingForCorrection: boolean;
  compiledCorrectionPrompt: string;
  correctionPastedJson: string;
  setCorrectionPastedJson: React.Dispatch<React.SetStateAction<string>>;
  onGenerateCorrectionPrompt: () => void;
  onApplyCorrectionJson: () => void;
  onCancelCorrection: () => void;
  onGoToImages: () => void;
  onBack: () => void;
}

// ─── ContentBlock ─────────────────────────────────────────────────────────────

interface ContentBlockProps {
  label: string;
  value: string;
  fieldKey: string;
  corrections: Record<string, string>;
  setCorrections: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  userWantsImage: Record<string, boolean>;
  setUserWantsImage: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const ContentBlock = ({
  label,
  value,
  fieldKey,
  corrections,
  setCorrections,
  userWantsImage,
  setUserWantsImage,
}: ContentBlockProps) => (
  <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4 transition-colors hover:border-white/20">
    <div className="flex justify-between items-center">
      <span className="text-violet-400 text-xs font-bold bg-violet-500/10 px-3 py-1 rounded-full">
        {label}
      </span>
      <label className="flex items-center gap-2 cursor-pointer text-xs text-white/60 select-none">
        <input
          type="checkbox"
          checked={!!userWantsImage[fieldKey]}
          onChange={(e) =>
            setUserWantsImage((prev) => ({ ...prev, [fieldKey]: e.target.checked }))
          }
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
      onChange={(e) =>
        setCorrections((prev) => ({ ...prev, [fieldKey]: e.target.value }))
      }
      placeholder="یادداشت یا نکته اصلاحی سردبیری برای این بخش..."
      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500 transition-colors"
    />
  </div>
);

// ─── Step3 ────────────────────────────────────────────────────────────────────

export default function Step3({
  articleData,
  corrections,
  setCorrections,
  userWantsImage,
  setUserWantsImage,
  isWaitingForCorrection,
  compiledCorrectionPrompt,
  correctionPastedJson,
  setCorrectionPastedJson,
  onGenerateCorrectionPrompt,
  onApplyCorrectionJson,
  onCancelCorrection,
  onGoToImages,
  onBack,
}: Step3Props) {
  return (
    <div className="space-y-6">

      {/* سئو */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ContentBlock
          label="متا تایتل سئو (Meta Title)"
          value={articleData.meta_title}
          fieldKey="meta_title"
          corrections={corrections}
          setCorrections={setCorrections}
          userWantsImage={userWantsImage}
          setUserWantsImage={setUserWantsImage}
        />
        <ContentBlock
          label="متا دیسکریپشن (Meta Description)"
          value={articleData.meta_description}
          fieldKey="meta_description"
          corrections={corrections}
          setCorrections={setCorrections}
          userWantsImage={userWantsImage}
          setUserWantsImage={setUserWantsImage}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ContentBlock
          label="کلمه کلیدی تمرکزی"
          value={articleData.focus_keyword}
          fieldKey="focus_keyword"
          corrections={corrections}
          setCorrections={setCorrections}
          userWantsImage={userWantsImage}
          setUserWantsImage={setUserWantsImage}
        />
        <ContentBlock
          label="نامک آدرس (Slug)"
          value={articleData.slug}
          fieldKey="slug"
          corrections={corrections}
          setCorrections={setCorrections}
          userWantsImage={userWantsImage}
          setUserWantsImage={setUserWantsImage}
        />
      </div>

      {/* محتوا */}
      <ContentBlock
        label="عنوان اصلی مقاله (H1)"
        value={articleData.h1}
        fieldKey="h1"
        corrections={corrections}
        setCorrections={setCorrections}
        userWantsImage={userWantsImage}
        setUserWantsImage={setUserWantsImage}
      />
      <ContentBlock
        label="مقدمه شروع مقاله (Introduction)"
        value={articleData.intro}
        fieldKey="intro"
        corrections={corrections}
        setCorrections={setCorrections}
        userWantsImage={userWantsImage}
        setUserWantsImage={setUserWantsImage}
      />

      {/* سکشن‌ها */}
      <div className="space-y-4">
        <p className="text-white/40 text-xs border-r-2 border-violet-500 pr-2 font-bold">
          بخش هدینگ‌ها و بدنه سکشن‌های مقاله
        </p>
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

      {/* جمع‌بندی */}
      <ContentBlock
        label="پاراگراف خلاصه و جمع‌بندی"
        value={articleData.conclusion}
        fieldKey="conclusion"
        corrections={corrections}
        setCorrections={setCorrections}
        userWantsImage={userWantsImage}
        setUserWantsImage={setUserWantsImage}
      />

      {/* باکس اصلاحیه */}
      {isWaitingForCorrection && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl space-y-4 my-6">
          <div className="flex justify-between items-center">
            <p className="text-amber-400 text-xs font-semibold">
              🛠️ دیتای گزارش اصلاحات کامپایل شد! آن را کپی کرده و به مدل زبانی تحویل دهید:
            </p>
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
            <p className="text-emerald-400 text-xs font-semibold mb-2">
              📥 خروجی کل JSON اصلاح‌شده جدید را اینجا قرار دهید:
            </p>
            <textarea
              value={correctionPastedJson}
              onChange={(e) => setCorrectionPastedJson(e.target.value)}
              placeholder="کل آبجکت اصلاح‌شده را بدون توضیحات اضافه پیست کنید..."
              className="w-full h-32 bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={onCancelCorrection}
              className="text-white/40 hover:text-white text-xs px-4 py-2 rounded-xl"
            >
              انصراف
            </button>
            <button
              onClick={onApplyCorrectionJson}
              disabled={!correctionPastedJson}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-5 py-2 rounded-xl font-medium disabled:opacity-40"
            >
              🔄 بروزرسانی میز تحریریه
            </button>
          </div>
        </div>
      )}

      {/* دکمه‌های پایین */}
      <div className="border-t border-white/10 pt-5 flex flex-wrap gap-3">
        <button
          onClick={onBack}
          className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm text-white font-medium hover:bg-white/10 transition-colors"
        >
          بازگشت
        </button>
        <button
          onClick={onGenerateCorrectionPrompt}
          className="bg-amber-600 hover:bg-amber-500 px-5 py-3.5 rounded-xl text-sm font-medium text-white flex-1 min-w-[180px] transition-colors"
        >
          ⚙️ ساخت پرامپت اصلاحیه سردبیری
        </button>
        <button
          onClick={onGoToImages}
          className="bg-violet-600 hover:bg-violet-500 px-5 py-3.5 rounded-xl text-sm font-bold text-white flex-1 min-w-[220px] shadow-lg shadow-violet-600/20 transition-all"
        >
          گام بعد: مدیریت و استودیو تصاویر هوشمند ✨
        </button>
      </div>

    </div>
  );
}
