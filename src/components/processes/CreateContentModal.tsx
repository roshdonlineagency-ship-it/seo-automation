"use client";

import { useState } from "react";
// وارد کردن اینترفیس‌ها از پوشه lib
import { ArticleData, ImageIdeaSet } from "@/lib/types"; 
// وارد کردن تابع منطقی از پوشه lib
import { handleFinalPublish } from "@/lib/articleActions"; 

// وارد کردن کامپوننت‌های مراحل از پوشه components/steps
import Step1 from "@/components/steps/Step1";
import Step2 from "@/components/steps/Step2";
import Step3 from "@/components/steps/Step3";
import Step4 from "@/components/steps/Step4";

export default function CreateContentModal({ projectId, onClose }: { projectId: number, onClose: () => void }) {
  // ۱. مدیریت وضعیت مرحله فعلی (اینجا می‌ماند چون همه مراحل به آن نیاز دارند)
  const [step, setStep] = useState(1);
  
  // ۲. مدیریت داده‌های اصلی (اینجا می‌ماند چون قلب تپنده پروژه است)
  const [articleData, setArticleData] = useState<ArticleData>(/* مقدار اولیه */);
  const [imageAssets, setImageAssets] = useState<ImageIdeaSet[]>([]);
  const [publishing, setPublishing] = useState(false);

  return (
    <div className="modal-container">
      {/* اینجا فقط منطق سوییچ کردن مراحل است */}
      
      {step === 1 && <Step1 data={articleData} setData={setArticleData} onNext={() => setStep(2)} />}
      
      {step === 2 && <Step2 data={articleData} setData={setArticleData} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      
      {step === 3 && <Step3 assets={imageAssets} setAssets={setImageAssets} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
      
      {step === 4 && (
        <Step4 
          assets={imageAssets} 
          articleData={articleData} 
          publishing={publishing}
          onBack={() => setStep(3)}
          // تابع انتشار را از lib/articleActions فراخوانی می‌کنیم
          onPublish={() => handleFinalPublish(articleData, imageAssets, setPublishing, console.log)} 
        />
      )}
    </div>
  );
}
