"use client";

import { useState, useEffect } from "react";
import { ArticleData, ImageIdeaSet, Prompt } from "@/lib/types"; 
import { handleFinalPublish } from "@/lib/articleActions"; 

import Step1 from "@/components/processes/steps/Step1";
import Step2 from "@/components/processes/steps/Step2";
import Step3 from "@/components/processes/steps/Step3";
import Step4 from "@/components/processes/steps/Step4";

export default function CreateContentModal({ projectId, onClose }: { projectId: number, onClose: () => void }) {
  // ۱. وضعیت‌های کلی پروژه
  const [step, setStep] = useState(1);
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [imageAssets, setImageAssets] = useState<ImageIdeaSet[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<string | null>(null);

  // ۲. وضعیت‌های مرحله ۱
  const [topic, setTopic] = useState("");
  const [targetPage, setTargetPage] = useState("");
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [pIds, setPIds] = useState({ gen: "", rev: "", idea: "", draw: "", meta: "" });

  // ۳. وضعیت‌های مرحله ۲
  const [pastedJson, setPastedJson] = useState("");

  // ۴. وضعیت‌های مرحله ۳
  const [corrections, setCorrections] = useState({});
  const [userWantsImage, setUserWantsImage] = useState(true);
  const [isWaitingForCorrection, setIsWaitingForCorrection] = useState(false);
  const [compiledCorrectionPrompt, setCompiledCorrectionPrompt] = useState("");
  const [correctionPastedJson, setCorrectionPastedJson] = useState("");

  // ۵. وضعیت‌های مرحله ۴
  const [ideaPromptText, setIdeaPromptText] = useState("");
  const [ideasJsonInput, setIdeasJsonInput] = useState("");
  const [seoPromptText, setSeoPromptText] = useState("");
  const [seoJsonInput, setSeoJsonInput] = useState("");

  // --- واکشی (Fetch) پرامپت‌ها در لحظه باز شدن مودال ---
  useEffect(() => {
    const fetchPrompts = async () => {
      setLoading(true);
      try {
        // مسیر API دیتابیس خود را اینجا تنظیم کن
        const response = await fetch(`/api/prompts?projectId=${projectId}`); 
        
        if (response.ok) {
          const data = await response.json();
          setPrompts(data || []);
        } else {
          console.error("خطا در دریافت پرامپت‌ها از سرور");
        }
      } catch (error) {
        console.error("خطای شبکه:", error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchPrompts();
    }
  }, [projectId]);

  // --- توابع منطقی (Handers) ---
  const handleParseInitialJson = () => { /* لاجیک پارس JSON مرحله ۲ */ };
  const handleApplyCorrectionJson = () => { /* لاجیک اعمال اصلاحیه مرحله ۳ */ };
  const handleGenerateCorrectionPrompt = () => { /* لاجیک ساخت پرامپت اصلاحیه مرحله ۳ */ };
  const setupImageWorkflow = () => { setStep(4); /* لاجیک آماده‌سازی تصاویر */ };
  const handleParseIdeasJson = () => { /* لاجیک پارس ایده‌های تصویر */ };
  const handleParseSeoJson = () => { /* لاجیک پارس سئو تصاویر */ };
  const handleIdeaSelection = (key: string, value: string) => { /* لاجیک انتخاب ایده */ };
  const getFinalGenerationPrompt = () => { return "/* پرامپت نهایی */"; };

  return (
    /* لایه بک‌دراپ تاریک و ثابت (Modal Wrapper) */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      
      {/* باکس اصلی فرم */}
      <div className="relative w-full max-w-5xl bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-2xl my-auto">
        
        {/* هدر پاپ آپ */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
          <h2 className="text-lg font-bold text-white">میز کار تولید محتوای هوشمند</h2>
          <button 
            onClick={onClose} 
            className="text-white/50 hover:text-red-500 transition-colors text-sm font-medium"
          >
            ✕ بستن
          </button>
        </div>

        {/* محتوای متغیر استپ‌ها */}
        {step === 1 && (
          <Step1 
            topic={topic} setTopic={setTopic}
            targetPage={targetPage} setTargetPage={setTargetPage}
            loading={loading} prompts={prompts}
            pIds={pIds} setPIds={setPIds}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Step2 
            getFinalGenerationPrompt={getFinalGenerationPrompt}
            pastedJson={pastedJson} setPastedJson={setPastedJson}
            handleParseInitialJson={handleParseInitialJson}
            setStep={setStep}
          />
        )}

        {step === 3 && articleData && (
          <Step3 
            articleData={articleData}
            corrections={corrections} setCorrections={setCorrections}
            userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage}
            isWaitingForCorrection={isWaitingForCorrection}
            setIsWaitingForCorrection={setIsWaitingForCorrection}
            compiledCorrectionPrompt={compiledCorrectionPrompt}
            correctionPastedJson={correctionPastedJson} setCorrectionPastedJson={setCorrectionPastedJson}
            handleApplyCorrectionJson={handleApplyCorrectionJson}
            handleGenerateCorrectionPrompt={handleGenerateCorrectionPrompt}
            setupImageWorkflow={setupImageWorkflow}
          />
        )}

        {step === 4 && (
          <Step4 
            imageAssets={imageAssets} setImageAssets={setImageAssets}
            published={published} publishing={publishing}
            ideaPromptText={ideaPromptText}
            ideasJsonInput={ideasJsonInput} setIdeasJsonInput={setIdeasJsonInput}
            handleParseIdeasJson={handleParseIdeasJson}
            handleIdeaSelection={handleIdeaSelection}
            seoPromptText={seoPromptText}
            seoJsonInput={seoJsonInput} setSeoJsonInput={setSeoJsonInput}
            handleParseSeoJson={handleParseSeoJson}
            handleFinalPublish={() => handleFinalPublish(articleData, imageAssets, setPublishing, console.log)}
            setStep={setStep}
          />
        )}

      </div>
    </div>
  );
}
