"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const processes = [
  { id: "create", title: "درج محتوا" },
  { id: "update", title: "آپدیت محتوا" },
  { id: "articles", title: "عنوان مقالات و تقویم انتشار" },
  { id: "pages", title: "عنوان صفحات و تقویم انتشار" },
];

export default function ProcessesPage() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [currentProcess, setCurrentProcess] = useState("");
  const [step, setStep] = useState(1);

  const [inputValue, setInputValue] = useState("");
  const [selectedOption, setSelectedOption] = useState("");

  const openProcess = (title: string) => {
    setCurrentProcess(title);
    setInputValue("");
    setSelectedOption("");
    setStep(1);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setStep(1);
    setInputValue("");
    setSelectedOption("");
  };

  const options = [
    "سایت اصلی",
    "وبلاگ",
    "لندینگ پیج",
    "محصول",
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-10" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="text-white/40 hover:text-white text-sm mb-8 flex items-center gap-2 transition-colors"
        >
          ← برگشت
        </button>

        <p className="text-white/40 text-sm mb-1">مدیریت</p>
        <h1 className="text-4xl font-bold mb-10 tracking-tight">
          فرایندها
        </h1>

        {/* Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {processes.map((process) => (
            <button
              key={process.id}
              onClick={() => openProcess(process.title)}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-right hover:bg-white/10 transition-all"
            >
              <div className="text-lg font-semibold mb-2">
                {process.title}
              </div>
              <div className="text-sm text-white/40">
                برای شروع فرایند کلیک کنید
              </div>
            </button>
          ))}
        </div>

        {/* Logs */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-5">
            لاگ‌ها
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors text-sm">
              لاگ درج محتوا
            </button>

            <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors text-sm">
              لاگ آپدیت محتوا
            </button>

            <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors text-sm">
              لاگ مقالات
            </button>

            <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors text-sm">
              لاگ صفحات
            </button>
          </div>
        </div>

        {/* Modal */}
        {isOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-5">
            <div className="w-full max-w-xl bg-[#111111] border border-white/10 rounded-3xl overflow-hidden">

              {/* Header */}
              <div className="border-b border-white/10 px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-white/40 text-xs mb-1">
                    فرایند
                  </p>
                  <h3 className="font-semibold">
                    {currentProcess}
                  </h3>
                </div>

                <button
                  onClick={closeModal}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                {/* Step Indicator */}
                <div className="flex items-center gap-2 mb-8">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-2 flex-1 rounded-full ${
                        step >= s
                          ? "bg-violet-500"
                          : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>

                {/* STEP 1 */}
                {step === 1 && (
                  <>
                    <h4 className="text-lg font-medium mb-4">
                      مرحله اول
                    </h4>

                    <textarea
                      rows={5}
                      value={inputValue}
                      onChange={(e) =>
                        setInputValue(e.target.value)
                      }
                      placeholder="ورودی مورد نظر را وارد کنید..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-white/20 resize-none"
                    />

                    <button
                      disabled={!inputValue.trim()}
                      onClick={() => setStep(2)}
                      className="mt-5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-6 py-3 rounded-xl text-sm font-medium"
                    >
                      ثبت
                    </button>
                  </>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <>
                    <h4 className="text-lg font-medium mb-4">
                      انتخاب گزینه
                    </h4>

                    <div className="space-y-3">
                      {options.map((option) => (
                        <button
                          key={option}
                          onClick={() =>
                            setSelectedOption(option)
                          }
                          className={`w-full text-right p-4 rounded-xl border transition-all ${
                            selectedOption === option
                              ? "border-violet-500 bg-violet-500/10"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>

                    <button
                      disabled={!selectedOption}
                      onClick={() => setStep(3)}
                      className="mt-5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-6 py-3 rounded-xl text-sm font-medium"
                    >
                      ثبت
                    </button>
                  </>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <>
                    <h4 className="text-lg font-medium mb-5">
                      تأیید نهایی
                    </h4>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
                      <div className="mb-4">
                        <p className="text-white/40 text-xs mb-1">
                          فرایند
                        </p>
                        <p>{currentProcess}</p>
                      </div>

                      <div className="mb-4">
                        <p className="text-white/40 text-xs mb-1">
                          ورودی
                        </p>
                        <p>{inputValue}</p>
                      </div>

                      <div>
                        <p className="text-white/40 text-xs mb-1">
                          گزینه انتخابی
                        </p>
                        <p>{selectedOption}</p>
                      </div>
                    </div>

                    <button
                      onClick={closeModal}
                      className="bg-violet-600 hover:bg-violet-500 transition-colors px-6 py-3 rounded-xl text-sm font-medium"
                    >
                      تأیید نهایی
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
