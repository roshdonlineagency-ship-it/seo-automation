"use client";

import { useState } from "react";
import { ArticleData, ImageIdeaSet, Prompt } from "@/lib/types"; 
import { handleFinalPublish } from "@/lib/articleActions"; 
import Step1 from "./steps/Step1";
import Step2 from "./steps/Step2";
import Step3 from "./steps/Step3";
import Step4 from "./steps/Step4";

export default function CreateContentModal({ projectId, onClose }: { projectId: number, onClose: () => void }) {
  const [step, setStep] = useState(1);
  
  // States برای کل فرم
  const [articleData, setArticleData] = useState<ArticleData>({
    meta_title: "", meta_description: "", focus_keyword: "", slug: "", h1: "", 
    intro: "", sections: [], faq: [], conclusion: "", cta: { text: "", anchor_text: "", target_url: "" }
  });
  const [imageAssets, setImageAssets] = useState<ImageIdeaSet[]>([]);
  const [publishing, setPublishing] = useState(false);
  
  // States مخصوص مرحله ۱
  const [topic, setTopic] = useState("");
  const [targetPage, setTargetPage] = useState("");
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]); 
  const [pIds, setPIds] = useState({ gen: "", rev: "", idea: "", draw: "", meta: "" });

  return (
    <div className="modal-container">
      {step === 1 && (
        <Step1 
          topic={topic} setTopic={setTopic}
          targetPage={targetPage} setTargetPage={setTargetPage}
          loading={loading} prompts={prompts}
          pIds={pIds} setPIds={setPIds}
          onNext={() => setStep(2)}
        />
      )}
      
      {step === 2 && <Step2 data={articleData} setData={setArticleData} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      
      {step === 3 && <Step3 assets={imageAssets} setAssets={setImageAssets} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
      
      {step === 4 && (
        <Step4 
          assets={imageAssets} 
          articleData={articleData} 
          publishing={publishing}
          onBack={() => setStep(3)}
          onPublish={() => handleFinalPublish(articleData, imageAssets, setPublishing, console.log)} 
        />
      )}
    </div>
  );
}
