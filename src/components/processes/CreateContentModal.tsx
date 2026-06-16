import React, { useState } from "react";

// تعریف دقیق اینترفیس برای جلوگیری از خطای "IntrinsicAttributes"
export interface CreateContentModalProps {
  onClose: () => void;
  projectId?: number;
  articleData?: any;
}

export default function CreateContentModal({ onClose, projectId, articleData }: CreateContentModalProps) {
  const [step, setStep] = useState(1);
  const [manualJson, setManualJson] = useState("");
  const [imageAssets, setImageAssets] = useState<any>({});

  // تابع پارس امن JSON
  const handleImportJson = () => {
    if (!manualJson.trim()) {
      alert("لطفاً ابتدا کد JSON را وارد کنید!");
      return;
    }
    try {
      const cleanJson = manualJson.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      
      const initialAssets: any = {};
      Object.keys(parsed).forEach((key) => {
        initialAssets[key] = {
          heading: key === "h1" ? "تیتر اصلی" : key === "intro" ? "مقدمه" : `بخش: ${key}`,
          ideas: Array.isArray(parsed[key]) ? parsed[key] : [parsed[key]],
          selectedIdea: Array.isArray(parsed[key]) ? parsed[key][0] : parsed[key],
          customIdea: "",
          finalPrompt: "",
          fileName: "",
          altText: "",
          isFinalized: false // برای نمایش وضعیت موفقیت
        };
      });
      setImageAssets(initialAssets);
      setStep(2);
    } catch (e) {
      alert("فرمت JSON وارد شده صحیح نیست. لطفاً ساختار را بررسی کنید.");
    }
  };

  // تابع نهایی‌سازی آفلاین
  const finalizeAsset = (key: string) => {
    const asset = imageAssets[key];
    const text = asset.customIdea.trim() || asset.selectedIdea;
    
    setImageAssets((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        finalPrompt: `Professional illustration for: ${text}`,
        fileName: `${text.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30)}.jpg`,
        altText: text,
        isFinalized: true
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl h-[85vh] bg-[#0c0c0e] border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* هدر */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#111114]">
          <div>
            <h2 className="text-white font-bold text-lg">استودیو محتوا و تصاویر</h2>
            <p className="text-zinc-500 text-xs mt-1">پروژه فعال: {projectId || "نامشخص"}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl">✕</button>
        </div>

        {/* بدنه */}
        <div className="flex-1 overflow-y-auto p-8">
          {step === 1 ? (
            <div className="space-y-4 max-w-2xl mx-auto">
              <label className="text-zinc-300 font-medium text-sm">مرحله ۱: ورود ساختار محتوا (JSON)</label>
              <textarea 
                className="w-full h-80 bg-black border border-zinc-700 rounded-xl p-4 text-emerald-400 font-mono text-xs focus:border-purple-500 outline-none transition-all"
                value={manualJson}
                onChange={(e) => setManualJson(e.target.value)}
                placeholder='مثال: {"h1": ["ایده ۱", "ایده ۲"], "intro": ["ایده ۱"]}'
              />
              <button 
                onClick={handleImportJson} 
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-bold transition-all"
              >
                پردازش و ورود به استودیو تصاویر
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(imageAssets).map((key) => (
                <div key={key} className={`p-5 rounded-xl border transition-all ${imageAssets[key].isFinalized ? "bg-purple-950/20 border-purple-900" : "bg-zinc-900/50 border-zinc-800"}`}>
                  <h3 className="text-purple-400 font-bold mb-3">{imageAssets[key].heading}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {imageAssets[key].ideas.map((idea: string, i: number) => (
                      <button 
                        key={i} 
                        onClick={() => setImageAssets({...imageAssets, [key]: {...imageAssets[key], selectedIdea: idea}})} 
                        className={`p-3 text-xs text-right border rounded-lg transition-all ${imageAssets[key].selectedIdea === idea ? "border-purple-500 bg-purple-900/50 text-white" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
                      >
                        {idea}
                      </button>
                    ))}
                  </div>
                  <input 
                    placeholder="ایده سفارشی (اولویت بالاتر)..." 
                    className="w-full bg-black p-3 border border-zinc-700 rounded-lg text-white text-sm mb-3" 
                    onChange={(e) => setImageAssets({...imageAssets, [key]: {...imageAssets[key], customIdea: e.target.value}})}
                  />
                  <button 
                    onClick={() => finalizeAsset(key)} 
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-all"
                  >
                    ⚙️ نهایی‌سازی و تولید متادیتای سئو
                  </button>
                  
                  {imageAssets[key].isFinalized && (
                    <div className="mt-4 p-3 bg-black rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-400 space-y-1 animate-pulse">
                      <p><span className="text-purple-500">Alt:</span> {imageAssets[key].altText}</p>
                      <p><span className="text-emerald-500">File:</span> {imageAssets[key].fileName}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* فوتر */}
        <div className="p-4 border-t border-zinc-800 bg-[#111114] flex justify-between items-center">
          <div className="flex gap-2">
            <div className={`h-1.5 w-8 rounded-full ${step >= 1 ? "bg-purple-600" : "bg-zinc-700"}`}></div>
            <div className={`h-1.5 w-8 rounded-full ${step >= 2 ? "bg-purple-600" : "bg-zinc-700"}`}></div>
          </div>
          <div className="flex gap-3">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="px-5 py-2 text-zinc-400 hover:text-white text-sm transition-all">
                بازگشت
              </button>
            )}
            <button 
              onClick={() => step === 1 ? handleImportJson() : onClose()} 
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold text-sm transition-all shadow-lg shadow-blue-900/20"
            >
              {step === 1 ? "ادامه" : "ذخیره و خروج"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
