"use client";

import React from "react";
import { ImageIdeaSet } from "@/lib/types";

interface Step4Props {
  imageAssets: Record<string, ImageIdeaSet>;
  setImageAssets: React.Dispatch<React.SetStateAction<any>>;
  published: string | null;
  publishing: boolean;
  ideaPromptText: string;
  ideasJsonInput: string;
  setIdeasJsonInput: React.Dispatch<React.SetStateAction<string>>;
  handleParseIdeasJson: () => void;
  handleIdeaSelection: (key: string, idea: string) => void;
  seoPromptText: string;
  seoJsonInput: string;
  setSeoJsonInput: React.Dispatch<React.SetStateAction<string>>;
  handleParseSeoJson: () => void;
  handleFinalPublish: () => void;
  setStep: React.Dispatch<React.SetStateAction<number>>;

  // فیلدهای اضافه شده در اینترفیس
  isPreparingHtml: boolean;
  handlePrepareHtmlPublish: () => void;
  htmlPromptText: string;
  htmlCodeInput: string;
  setHtmlCodeInput: React.Dispatch<React.SetStateAction<string>>;
  handleFinalHtmlPublish: () => void;
}

export default function Step4({
  imageAssets,
  setImageAssets,
  published,
  publishing,
  ideaPromptText,
  ideasJsonInput,
  setIdeasJsonInput,
  handleParseIdeasJson,
  handleIdeaSelection,
  seoPromptText,
  seoJsonInput,
  setSeoJsonInput,
  handleParseSeoJson,
  handleFinalPublish,
  setStep,

  // پارامترهای جدید پیاده‌سازی شده
  isPreparingHtml,
  handlePrepareHtmlPublish,
  htmlPromptText,
  htmlCodeInput,
  setHtmlCodeInput,
  handleFinalHtmlPublish,
}: Step4Props) {
  return (
    <div className="space-y-6">
      {published ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-2xl text-center space-y-4">
          <div className="text-emerald-400 text-4xl">🎉</div>
          <h4 className="text-lg font-bold text-emerald-400">مقاله با موفقیت در وردپرس منتشر شد!</h4>
          <p className="text-xs text-white/70">محتوا به همراه تمام تصاویر و تنظیمات سئو در سایت قرار گرفت.</p>
          <a href={published} target="_blank" rel="noreferrer" className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-semibold transition-colors">
            مشاهده پست منتشر شده ↗
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          
          {Object.keys(imageAssets).length === 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 p-5 rounded-2xl space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-blue-400 text-xs font-bold">۱. پرامپت استخراج ایده‌های تصویر را کپی کنید:</p>
                  <button onClick={() => { navigator.clipboard.writeText(ideaPromptText); alert("کپی شد!"); }} className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[11px] px-3 py-1.5 rounded-lg border border-blue-500/20">📋 کپی پرامپت ایده</button>
                </div>
                <textarea readOnly value={ideaPromptText} className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white/70 font-mono focus:outline-none resize-none custom-scrollbar" onClick={(e) => (e.target as HTMLTextAreaElement).select()} />
              </div>
              
              <div>
                <p className="text-emerald-400 text-xs font-bold mb-2">۲. خروجی JSON هوش مصنوعی را برای ایده‌ها در اینجا قرار دهید:</p>
                <textarea value={ideasJsonInput} onChange={(e) => setIdeasJsonInput(e.target.value)} placeholder='[\n  {\n    "section_id": "sec_1",\n    "ideas": ["ایده اول", "ایده دوم", "ایده سوم"]\n  }\n]' className="w-full h-32 bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none custom-scrollbar" />
                <button onClick={handleParseIdeasJson} disabled={!ideasJsonInput} className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs font-bold disabled:opacity-40 transition-colors shadow-lg">تایید و نمایش ایده‌ها</button>
              </div>
            </div>
          )}

          {Object.keys(imageAssets).length > 0 && (
            <div className="space-y-8">
              {Object.keys(imageAssets).map((key) => {
                const asset = imageAssets[key];
                return (
                  <div key={key} className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4 relative hover:border-white/20 transition-all">
                    <div className="border-b border-white/5 pb-3">
                      <span className="text-xs text-violet-400 font-bold bg-violet-500/10 px-3 py-1 rounded-full">{asset.heading}</span>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[11px] text-white/40 font-semibold">انتخاب بهترین ایده برای ساخت پرامپت نهایی:</label>
                      {asset.ideas?.map((idea: string, index: number) => (
                        <label key={index} className="flex items-start gap-3 p-3 rounded-xl bg-black/20 border border-white/5 cursor-pointer hover:border-white/20 hover:bg-white/5 transition-all">
                          <input type="radio" name={`selected-idea-${key}`} value={idea} checked={asset.selectedIdea === idea} onChange={(e) => handleIdeaSelection(key, e.target.value)} className="mt-0.5 text-violet-600 focus:ring-violet-500 rounded-full cursor-pointer" />
                          <span className="text-xs text-white/80 leading-5">{idea}</span>
                        </label>
                      ))}
                    </div>

                    <div className="space-y-2 bg-black/30 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-violet-400 font-bold text-[11px]">پرامپت توسعه‌یافته جهت تولید تصویر (DALL-E / Midjourney):</span>
                        <button onClick={() => { navigator.clipboard.writeText(asset.generatedPrompt); alert("پرامپت ساخت تصویر کپی شد!"); }} className="bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] px-3 py-1 rounded-lg border border-white/10 transition-colors">📋 کپی پرامپت</button>
                      </div>
                      <textarea readOnly value={asset.generatedPrompt} className="w-full h-24 bg-black/50 p-3 rounded-lg border border-white/5 font-mono text-white/70 text-[11px] resize-none focus:outline-none custom-scrollbar" onClick={(e) => (e.target as HTMLTextAreaElement).select()} />
                    </div>

                    {(asset.fileName || asset.altText) && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <span className="text-emerald-400 font-bold text-[11px] block">نام فایل سئو شده (SEO Filename):</span>
                            <input type="text" value={asset.fileName} readOnly className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white/60 text-xs focus:outline-none" />
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-emerald-400 font-bold text-[11px] block">متن جایگزین عکس (Alt Text):</span>
                            <input type="text" value={asset.altText} readOnly className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white/60 text-xs focus:outline-none" />
                          </div>
                        </div>
                        <div className="space-y-2 pt-2 bg-white/5 p-4 rounded-xl border border-white/5">
                          <label className="block text-[11px] text-white/60 font-bold">انتخاب فایل فیزیکی تصویر نهایی رندر شده جهت آپلود:</label>
                          <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setImageAssets((prev: any) => ({ ...prev, [key]: { ...prev[key], file } })); } }} className="w-full text-xs text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer" />
                          {asset.file && <span className="text-xs text-emerald-400 block mt-2 font-bold flex items-center gap-2">✅ تصویر با موفقیت پیوست شد: {asset.file.name}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {!Object.values(imageAssets)[0]?.fileName && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl space-y-5 shadow-xl">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-emerald-400 text-xs font-bold uppercase tracking-wide">۳. پرامپت تولید دیتای سئو تصاویر را کپی کنید:</p>
                      <button onClick={() => { navigator.clipboard.writeText(seoPromptText); alert("کپی شد!"); }} className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-[11px] px-3 py-1.5 rounded-lg border border-emerald-500/20 font-bold transition-all">📋 کپی پرامپت سئو</button>
                    </div>
                    <textarea readOnly value={seoPromptText} className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white/70 font-mono focus:outline-none resize-none custom-scrollbar" onClick={(e) => (e.target as HTMLTextAreaElement).select()} />
                  </div>
                  
                  <div className="pt-4 border-t border-emerald-500/20">
                    <p className="text-emerald-400 text-xs font-bold mb-3 uppercase tracking-wide">۴. خروجی JSON اطلاعات سئو را اینجا قرار دهید:</p>
                    <textarea value={seoJsonInput} onChange={(e) => setSeoJsonInput(e.target.value)} placeholder='[\n  {\n    "section_id": "sec_1",\n    "filename": "example-image.jpg",\n    "alt": "Example alt text"\n  }\n]' className="w-full h-32 bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none custom-scrollbar" />
                    <button onClick={handleParseSeoJson} disabled={!seoJsonInput} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-colors shadow-lg shadow-emerald-900/30">تایید نهایی و اعمال تنظیمات سئو تصاویر ✅</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* سکشن پایینی دکمه‌ها و مدیریت سابمیت نهایی */}
          <div className="border-t border-white/10 pt-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setStep(3)} className="bg-white/5 border border-white/10 px-6 py-4 rounded-xl text-sm text-white font-medium hover:bg-white/10 transition-colors">برگشت به میز تحریریه</button>
              
              <button onClick={handleFinalPublish} disabled={publishing || isPreparingHtml || !Object.values(imageAssets)[0]?.fileName} className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-6 py-4 rounded-xl text-sm font-bold text-white shadow-xl shadow-violet-600/20 transition-all">
                {publishing ? "در حال آپلود مدیا و تزریق ساختار بومی مقاله در وردپرس..." : "🚀 تایید نهایی و انتشار مستقیم در هسته وردپرس"}
              </button>

              {/* دکمه درخواستی جدید کاربر */}
              <button onClick={handlePrepareHtmlPublish} disabled={publishing || isPreparingHtml || !Object.values(imageAssets)[0]?.fileName} className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 px-6 py-4 rounded-xl text-sm font-bold text-white shadow-xl shadow-amber-600/20 transition-all">
                {isPreparingHtml ? "در حال آپلود موازی تصاویر و ایجاد ساختار پرامپت..." : "⚡ انتشار کد html در وردپرس"}
              </button>
            </div>

            {/* بخش رابط کاربری دریافت کد HTML نهایی از سیستم هوش مصنوعی */}
            {htmlPromptText && (
              <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-2xl space-y-5 mt-4 animate-in fade-in duration-300">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-amber-400 text-xs font-bold uppercase tracking-wide">۵. پرامپت ترکیبی (رفرنس CSS + دیتای خام + لینک تصاویر فیزیکی):</p>
                    <button onClick={() => { navigator.clipboard.writeText(htmlPromptText); alert("پرامپت توسعه‌یافته کپی شد!"); }} className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 text-[11px] px-3 py-1.5 rounded-lg border border-amber-500/20 font-bold transition-all">📋 کپی پرامپت HTML</button>
                  </div>
                  <textarea readOnly value={htmlPromptText} className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white/70 font-mono focus:outline-none resize-none custom-scrollbar" onClick={(e) => (e.target as HTMLTextAreaElement).select()} />
                </div>
                
                <div className="pt-4 border-t border-amber-500/10">
                  <p className="text-amber-400 text-xs font-bold mb-3 uppercase tracking-wide">۶. خروجی استایل‌دهی شده هوش مصنوعی (محتوای خالص HTML) را اینجا قرار دهید:</p>
                  <textarea value={htmlCodeInput} onChange={(e) => setHtmlCodeInput(e.target.value)} placeholder="<div>\n  <h2 class='custom-heading'>...</h2>\n  <img src='...' />\n</div>" className="w-full h-48 bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none custom-scrollbar" />
                  
                  <button onClick={handleFinalHtmlPublish} disabled={!htmlCodeInput || publishing} className="mt-4 w-full bg-amber-600 hover:bg-amber-500 text-white py-3.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-colors shadow-lg shadow-amber-900/30">
                     {publishing ? "در حال ارسال و تزریق مستقیم ساختار کد در هسته وردپرس..." : "🚀 تایید ساختار کد و انتشار مستقیم پست"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
