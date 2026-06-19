"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CreateContentModal from "@/components/processes/CreateContentModal";

const processes = [
  { id: "create", title: "درج محتوا" },
  { id: "update", title: "آپدیت محتوا" },
  { id: "articles", title: "عنوان مقالات و تقویم انتشار" },
  { id: "pages", title: "عنوان صفحات و تقویم انتشار" },
];

function AutomationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // دریافت projectId از URL و تبدیل به عدد. اگر پیدا نشد، 0 لحاظ می‌شود.
  const projectId = Number(searchParams.get("projectId")) || 0;

  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openProcess = (id: string) => {
    setActiveModal(id);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-10" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-white/40 hover:text-white text-sm mb-8 flex items-center gap-2 transition-colors"
        >
          ← برگشت
        </button>

        <p className="text-white/40 text-sm mb-1">مدیریت</p>
        <h1 className="text-4xl font-bold mb-10 tracking-tight">فرایندها</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {processes.map((process) => (
            <button
              key={process.id}
              onClick={() => openProcess(process.id)}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-right hover:bg-white/10 transition-all"
            >
              <div className="text-lg font-semibold mb-2">{process.title}</div>
              <div className="text-sm text-white/40">برای شروع فرایند کلیک کنید</div>
            </button>
          ))}
        </div>

        {/* بخش لاگ‌ها */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-5">لاگ‌ها</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["لاگ درج محتوا", "لاگ آپدیت محتوا", "لاگ مقالات", "لاگ صفحات"].map((log, i) => (
              <button key={i} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-sm">
                {log}
              </button>
            ))}
          </div>
        </div>

        {/* مودال */}
        {activeModal === "create" && (
          <CreateContentModal
            projectId={projectId}
            onClose={closeModal}
          />
        )}
      </div>
    </div>
  );
}

// استفاده از Suspense برای جلوگیری از خطای Next.js در استفاده از useSearchParams
export default function ProcessesPage() {
  return (
    <Suspense fallback={<div className="text-white p-10">در حال بارگذاری...</div>}>
      <AutomationContent />
    </Suspense>
  );
}
