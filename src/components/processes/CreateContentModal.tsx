"use client";

import { useEffect, useState } from "react";

interface Prompt {
  id: number;
  name: string;
  text: string;
}

interface Props {
  onClose: () => void;
  projectId: number;
}

export default function CreateContentModal({
  onClose,
  projectId,
}: Props) {
  const [step, setStep] = useState(1);

  const [topic, setTopic] = useState("");
  const [targetPage, setTargetPage] = useState("");

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [promptId, setPromptId] = useState("");
  const [selectedPrompt, setSelectedPrompt] =
    useState<Prompt | null>(null);

  useEffect(() => {
    loadPrompts();
  }, []);

  async function loadPrompts() {
    const res = await fetch(
      `/api/prompts?projectId=${projectId}`
    );

    const data = await res.json();
    setPrompts(data);
  }

  const handleSubmit = () => {
    const prompt = prompts.find(
      (p) => p.id === Number(promptId)
    );

    if (!prompt) return;

    setSelectedPrompt(prompt);
    setStep(2);
  };

  const finalPrompt = selectedPrompt
    ? `${selectedPrompt.text}

موضوع محتوا:
${topic}

صفحه هدف لینک سازی:
${targetPage}`
    : "";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-5">
      <div className="w-full max-w-3xl bg-[#111111] border border-white/10 rounded-3xl overflow-hidden">

        <div className="border-b border-white/10 px-6 py-5 flex items-center justify-between">
          <h3 className="font-semibold">
            درج محتوا
          </h3>

          <button
            onClick={onClose}
            className="text-white/40 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="p-6">

          {/* STEP 1 */}

          {step === 1 && (
            <div className="space-y-4">

              <input
                value={topic}
                onChange={(e) =>
                  setTopic(e.target.value)
                }
                placeholder="موضوع محتوا..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
              />

              <input
                value={targetPage}
                onChange={(e) =>
                  setTargetPage(e.target.value)
                }
                placeholder="صفحه تارگت لینک سازی..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
              />

              <select
                value={promptId}
                onChange={(e) =>
                  setPromptId(e.target.value)
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
              >
                <option value="">
                  انتخاب پرامپت
                </option>

                {prompts.map((prompt) => (
                  <option
                    key={prompt.id}
                    value={prompt.id}
                  >
                    {prompt.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSubmit}
                disabled={
                  !topic ||
                  !targetPage ||
                  !promptId
                }
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-6 py-3 rounded-xl"
              >
                ثبت
              </button>
            </div>
          )}

          {/* STEP 2 */}

          {step === 2 && (
            <div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">

                <div className="mb-4">
                  <p className="text-white/40 text-xs mb-1">
                    موضوع
                  </p>
                  <p>{topic}</p>
                </div>

                <div className="mb-4">
                  <p className="text-white/40 text-xs mb-1">
                    صفحه تارگت
                  </p>
                  <p>{targetPage}</p>
                </div>

                <div>
                  <p className="text-white/40 text-xs mb-1">
                    پرامپت انتخابی
                  </p>
                  <p>{selectedPrompt?.name}</p>
                </div>

              </div>

              <div className="bg-black/30 border border-white/10 rounded-2xl p-5">

                <p className="text-white/40 text-xs mb-3">
                  پرامپت نهایی
                </p>

                <pre className="whitespace-pre-wrap text-sm leading-7">
                  {finalPrompt}
                </pre>

              </div>

              <div className="mt-5 flex gap-3">

                <button
                  onClick={() => setStep(1)}
                  className="bg-white/5 border border-white/10 px-5 py-3 rounded-xl"
                >
                  بازگشت
                </button>

                <button
                  onClick={onClose}
                  className="bg-violet-600 px-5 py-3 rounded-xl"
                >
                  تایید نهایی
                </button>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
