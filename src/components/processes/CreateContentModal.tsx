"use client";

import { useState, useEffect } from "react";
import { ArticleData, ImageIdeaSet, Prompt } from "@/lib/types";
import { handleFinalPublish } from "@/lib/articleActions";

import Step1 from "@/components/processes/steps/Step1";
import Step2 from "@/components/processes/steps/Step2";
import Step3 from "@/components/processes/steps/Step3";
import Step4 from "@/components/processes/steps/Step4";

export default function CreateContentModal({ projectId, onClose }: { projectId: number, onClose: () => void }) {
  // --- States ---
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [imageAssets, setImageAssets] = useState<Record<string, ImageIdeaSet>>({});
  
  const [topic, setTopic] = useState("");
  const [targetPage, setTargetPage] = useState("");
  const [pIds, setPIds] = useState({ gen: "", rev: "", idea: "", draw: "", meta: "" });
  const [pastedJson, setPastedJson] = useState("");
  
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [userWantsImage, setUserWantsImage] = useState<Record<string, boolean>>({});
  const [isWaitingForCorrection, setIsWaitingForCorrection] = useState(false);
  const [compiledCorrectionPrompt, setCompiledCorrectionPrompt] = useState("");
  const [correctionPastedJson, setCorrectionPastedJson] = useState("");

  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<string | null>(null);
  const [ideaPromptText, setIdeaPromptText] = useState("");
  const [ideasJsonInput, setIdeasJsonInput] = useState("");
  const [seoPromptText, setSeoPromptText] = useState("");
  const [seoJsonInput, setSeoJsonInput] = useState("");

  // --- Utilities ---
  const cleanAndParseJson = (rawContent: string) => {
    let clean = rawContent.trim();
    if (clean.includes("```json")) clean = clean.split("```json")[1].split("```")[0].trim();
    else if (clean.includes("```")) clean = clean.split("```")[1].split("```")[0].trim();
    return JSON.parse(clean);
  };

  // --- تابع مرکزی برای تولید لحظه‌ای پرامپت سئو ---
  const refreshSeoPrompt = (assets: Record<string, ImageIdeaSet>) => {
    const activeKeys = Object.keys(userWantsImage).filter(key => userWantsImage[key]);
    const seoPromptBase = prompts.find((p: any) => String(p.id) === String(pIds.meta))?.text || "پرامپت سئو تعریف نشده";
    
    const sectionsData = activeKeys.map(key => ({
      section_id: key,
      title: key === "h1" ? articleData?.h1 : key === "intro" ? "Intro" : articleData?.sections?.find(s => s.id === key)?.h2,
      selected_idea: assets[key]?.selectedIdea || "در حال دریافت ایده..."
    }));

    setSeoPromptText(`${seoPromptBase}\n\nJSON ورودی:\n${JSON.stringify(sectionsData, null, 2)}`);
  };

  // --- Handlers ---
  const handleIdeaSelection = (key: string, newIdea: string) => {
    const drawPromptBase = prompts.find((p: any) => String(p.id) === String(pIds.draw))?.text || "";
    
    setImageAssets(prev => {
      const updatedAssets = {
        ...prev,
        [key]: {
          ...prev[key],
          selectedIdea: newIdea,
          generatedPrompt: `${drawPromptBase}\n\nIdea: ${newIdea}`
        }
      };
      refreshSeoPrompt(updatedAssets);
      return updatedAssets;
    });
  };

  const handleParseIdeasJson = () => {
    try {
      const parsed = cleanAndParseJson(ideasJsonInput);
      const newAssets: any = {};
      parsed.forEach((item: any) => {
        const drawPromptBase = prompts.find((p: any) => String(p.id) === String(pIds.draw))?.text || "";
        newAssets[item.section_id] = { 
            sectionId: item.section_id, 
            heading: item.section_id, 
            ideas: item.ideas || [], 
            selectedIdea: item.ideas?.[0] || "", 
            generatedPrompt: `${drawPromptBase}\n\nIdea: ${item.ideas?.[0]}` 
        };
      });
      setImageAssets(newAssets);
      refreshSeoPrompt(newAssets);
    } catch (e) { alert("خطا در پارس ایده‌ها"); }
  };

  const handleParseSeoJson = () => {
    try {
      const parsed = cleanAndParseJson(seoJsonInput);
      setImageAssets(prev => {
        const next = { ...prev };
        parsed.forEach((item: any) => {
          if (next[item.section_id]) {
            next[item.section_id].fileName = item.filename;
            next[item.section_id].altText = item.alt;
          }
        });
        refreshSeoPrompt(next);
        return next;
      });
    } catch (e) { alert("خطا در پارس سئو"); }
  };

  // --- Initial Load ---
  useEffect(() => {
    const fetchPrompts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/prompts?projectId=${projectId}`);
        if (response.ok) setPrompts(await response.json());
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    if (projectId) fetchPrompts();
  }, [projectId]);

  const setupImageWorkflow = () => {
    const activeKeys = Object.keys(userWantsImage).filter(key => userWantsImage[key]);
    if (activeKeys.length === 0) return alert("لطفاً حداقل یک بخش را انتخاب کنید.");

    const ideaPromptBase = prompts.find((p: any) => String(p.id) === String(pIds.idea))?.text || "";
    const sectionsData = activeKeys.map(key => ({
      section_id: key,
      title: key === "h1" ? articleData?.h1 : key === "intro" ? "Intro" : articleData?.sections?.find(s => s.id === key)?.h2
    }));

    setIdeaPromptText(`${ideaPromptBase}\n\nJSON:\n${JSON.stringify(sectionsData, null, 2)}`);
    setStep(4);
  };

  const handleParseInitialJson = () => { try { const parsedData = cleanAndParseJson(pastedJson); setArticleData(parsedData); const imageToggles: any = { h1: false, intro: false, conclusion: false }; parsedData.sections?.forEach((sec: any) => imageToggles[sec.id] = sec.needs_image ?? false); setUserWantsImage(imageToggles); setStep(3); } catch (e) { alert("JSON نامعتبر"); } };
  const handleGenerateCorrectionPrompt = () => { if (!articleData) return; const revPrompt = prompts.find((p: any) => String(p.id) === String(pIds.rev)); setCompiledCorrectionPrompt(`${revPrompt?.text}\n\nDATA:\n${JSON.stringify(articleData, null, 2)}`); setIsWaitingForCorrection(true); };
  const handleApplyCorrectionJson = () => { try { const parsedData = cleanAndParseJson(correctionPastedJson); setArticleData(parsedData); alert("اصلاح شد!"); setIsWaitingForCorrection(false); } catch (e) { alert("خطا در پارس"); } };
  const getFinalGenerationPrompt = () => { const selectedGenPrompt = prompts.find((p: any) => String(p.id) === String(pIds.gen)); return `Topic: ${topic}\nTarget: ${targetPage}\n\n${selectedGenPrompt?.text || ""}`; };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-2xl my-auto">
        <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
          <h2 className="text-lg font-bold text-white">میز کار تولید محتوا - مرحله {step}</h2>
          <button onClick={onClose} className="text-white/50 hover:text-red-500 transition-colors">✕</button>
        </div>

        {step === 1 && <Step1 topic={topic} setTopic={setTopic} targetPage={targetPage} setTargetPage={setTargetPage} loading={loading} prompts={prompts} pIds={pIds} setPIds={setPIds} onNext={() => setStep(2)} />}
        {step === 2 && <Step2 getFinalGenerationPrompt={getFinalGenerationPrompt} pastedJson={pastedJson} setPastedJson={setPastedJson} handleParseInitialJson={handleParseInitialJson} setStep={setStep} />}
        {step === 3 && articleData && <Step3 articleData={articleData} corrections={corrections} setCorrections={setCorrections} userWantsImage={userWantsImage} setUserWantsImage={setUserWantsImage} isWaitingForCorrection={isWaitingForCorrection} setIsWaitingForCorrection={setIsWaitingForCorrection} compiledCorrectionPrompt={compiledCorrectionPrompt} correctionPastedJson={correctionPastedJson} setCorrectionPastedJson={setCorrectionPastedJson} handleApplyCorrectionJson={handleApplyCorrectionJson} handleGenerateCorrectionPrompt={handleGenerateCorrectionPrompt} setupImageWorkflow={setupImageWorkflow} />}
        {step === 4 && (
          <Step4 
            imageAssets={imageAssets} 
            setImageAssets={setImageAssets} 
            published={published} 
            publishing={publishing} 
            ideaPromptText={ideaPromptText} 
            ideasJsonInput={ideasJsonInput} 
            setIdeasJsonInput={setIdeasJsonInput} 
            handleParseIdeasJson={handleParseIdeasJson} 
            handleIdeaSelection={handleIdeaSelection} 
            seoPromptText={seoPromptText} 
            seoJsonInput={seoJsonInput} 
            setSeoJsonInput={setSeoJsonInput} 
            handleParseSeoJson={handleParseSeoJson} 
            handleFinalPublish={() => handleFinalPublish(articleData!, imageAssets, setPublishing, (link) => setPublished(link))} 
            setStep={setStep} 
          />
        )}
      </div>
    </div>
  );
}
