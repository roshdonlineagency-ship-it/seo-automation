"use client";

import { useState, useEffect } from "react";
import { ArticleData, ImageIdeaSet, Prompt } from "@/lib/types";
import { handleFinalPublish } from "@/lib/articleActions";

import Step1 from "@/components/processes/steps/Step1";
import Step2 from "@/components/processes/steps/Step2";
import Step3 from "@/components/processes/steps/Step3";
import Step4 from "@/components/processes/steps/Step4";

export default function CreateContentModal({ projectId, onClose }: { projectId: number, onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [imageAssets, setImageAssets] = useState<ImageIdeaSet[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<string | null>(null);

  const [topic, setTopic] = useState("");
  const [targetPage, setTargetPage] = useState("");
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [pIds, setPIds] = useState({ gen: "", rev: "", idea: "", draw: "", meta: "" });
  const [pastedJson, setPastedJson] = useState("");
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [userWantsImage, setUserWantsImage] = useState<Record<string, boolean>>({});
  const [isWaitingForCorrection, setIsWaitingForCorrection] = useState(false);
  const [compiledCorrectionPrompt, setCompiledCorrectionPrompt] = useState("");
  const [correctionPastedJson, setCorrectionPastedJson] = useState("");
  const [ideaPromptText, setIdeaPromptText] = useState("");
  const [ideasJsonInput, setIdeasJsonInput] = useState("");
  const [seoPromptText, setSeoPromptText] = useState("");
  const [seoJsonInput, setSeoJsonInput] = useState("");

  useEffect(() => {
    const fetchPrompts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/prompts?projectId=${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setPrompts(data || []);
        }
      } catch (error) {
        console.error("خطا در دریافت پرامپت‌ها:", error);
      } finally {
        setLoading(false);
      }
    };
    if (projectId) fetchPrompts();
  }, [projectId]);

  const handleParseInitialJson = () => {
    try {
      const parsedData: ArticleData = JSON.parse(pastedJson);
      setArticleData(parsedData);

      const imageToggles: Record<string, boolean> = {
        h1: false,
        intro: false,
        conclusion: false,
      };
      parsedData.sections?.forEach((sec) => {
        imageToggles[sec.id] = sec.needs_image ?? false;
      });
      setUserWantsImage(imageToggles);
      setStep(3);
    } catch (error) {
      alert("خطا: فرمت JSON نامعتبر است!");
    }
  };

  const handleGenerateCorrectionPrompt = () => {
    if (!articleData) return;
    const revPrompt = prompts.find((p: any) => String(p.id) === String(pIds.rev));
    const promptText = revPrompt?.text || "متن پرامپت بازبینی در دیتابیس موجود نیست.";

    // ساخت گزارش اصلاحات با همان ساختار JSON مقاله
    const reviewReport = {
      meta_title: corrections["meta_title"]?.trim() || "تایید شده (عینا تکرار شود)",
      meta_description: corrections["meta_description"]?.trim() || "تایید شده (عینا تکرار شود)",
      focus_keyword: corrections["focus_keyword"]?.trim() || "تایید شده (عینا تکرار شود)",
      slug: corrections["slug"]?.trim() || "تایید شده (عینا تکرار شود)",
      h1: corrections["h1"]?.trim() || "تایید شده (عینا تکرار شود)",
      intro: corrections["intro"]?.trim() || "تایید شده (عینا تکرار شود)",
      conclusion: corrections["conclusion"]?.trim() || "تایید شده (عینا تکرار شود)",
      sections: articleData.sections?.map((sec) => ({
        id: sec.id,
        h2: sec.h2,
        status: corrections[sec.id]?.trim() || "تایید شده (عینا تکرار شود)",
      })),
    };

    const finalCorrectionPrompt =
`${promptText}

دیتای فعلی مقاله (JSON کامل):
${JSON.stringify(articleData, null, 2)}

گزارش اصلاحات سردبیری:
${JSON.stringify(reviewReport, null, 2)}`;

    setCompiledCorrectionPrompt(finalCorrectionPrompt);
    setIsWaitingForCorrection(true);
  };

  const handleApplyCorrectionJson = () => {
    try {
      const parsedData: ArticleData = JSON.parse(correctionPastedJson);
      setArticleData(parsedData);

      const imageToggles: Record<string, boolean> = {
        h1: userWantsImage["h1"] ?? false,
        intro: userWantsImage["intro"] ?? false,
        conclusion: userWantsImage["conclusion"] ?? false,
      };
      parsedData.sections?.forEach((sec) => {
        imageToggles[sec.id] = userWantsImage[sec.id] ?? sec.needs_image ?? false;
      });
      setUserWantsImage(imageToggles);

      alert("اصلاحات اعمال شد! 🚀");
      setIsWaitingForCorrection(false);
      setCorrectionPastedJson("");
      setCorrections({});
    } catch (error) {
      alert("خطا: فرمت JSON اصلاحیه نامعتبر است!");
    }
  };

  const setupImageWorkflow = () => {
    setStep(4);
  };

  const getFinalGenerationPrompt = () => {
    const selectedGenPrompt = prompts.find((p: any) => String(p.id) === String(pIds.gen));
    return `موضوع کلیدی: ${topic}\nلینک هدف: ${targetPage}\n\nدستورالعمل:\n${selectedGenPrompt?.text || ""}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-2xl my-auto">

        <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
          <h2 className="text-lg font-bold text-white">میز کار تولید محتوای هوشمند - مرحله {step}</h2>
          <button onClick={onClose} className="text-white/50 hover:text-red-500 transition-colors text-sm font-medium">✕ بستن</button>
        </div>

        {step === 1 && (
          <Step1
            topic={topic} setTopic={setTopic}
            targetPage={targetPage} setTargetPage={setTargetPage}
            loading={loading}
            prompts={prompts}
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
            handleParseIdeasJson={() => console.log("Parsing Ideas...")}
            handleIdeaSelection={(k: string, v: string) => console.log(k, v)}
            seoPromptText={seoPromptText}
            seoJsonInput={seoJsonInput} setSeoJsonInput={setSeoJsonInput}
            handleParseSeoJson={() => console.log("Parsing SEO...")}
            handleFinalPublish={() => handleFinalPublish(articleData, imageAssets, setPublishing, (link) => setPublished(link))}
            setStep={setStep}
          />
        )}

      </div>
    </div>
  );
}
