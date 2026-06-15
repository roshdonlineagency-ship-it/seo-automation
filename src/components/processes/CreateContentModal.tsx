"use client";

interface Props {
  onClose: () => void;
}

export default function CreateContentModal({
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#111] border border-white/10 rounded-3xl p-8 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-6">
          درج محتوا
        </h2>

        <button
          onClick={onClose}
          className="bg-violet-600 px-5 py-3 rounded-xl"
        >
          بستن
        </button>
      </div>
    </div>
  );
}
