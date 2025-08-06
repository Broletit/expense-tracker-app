'use client';

import { ReactNode, useEffect } from "react";

type Props = {
  children: ReactNode;
  onClose: () => void;
};

export default function Modal({ children, onClose }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-xl w-full relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl font-bold"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
