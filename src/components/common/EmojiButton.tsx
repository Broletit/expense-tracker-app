'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import data from '@emoji-mart/data';

// Lazy-load picker (chỉ client)
const Picker = dynamic(() => import('@emoji-mart/react'), { ssr: false });

export default function EmojiButton({
  value,
  onChange,
  className = 'px-3 py-2 border rounded bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900',
  size = 18,
}: {
  value?: string;                 
  onChange: (v: string) => void;  
  className?: string;
  size?: number;
}) {
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement | null>(null);

  // click ngoài -> đóng
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={className}
        aria-label="Chọn emoji"
      >
        <span style={{ fontSize: size }}>{value || '😊'}</span>
      </button>

      {open && (
        <div
          ref={popRef}
          className="absolute z-50 mt-2 shadow-xl rounded-xl overflow-hidden border bg-white dark:bg-gray-950"
        >
          <Picker
            data={data}
            theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
            onEmojiSelect={(e: any) => {
              onChange(e.native);
              setOpen(false);
            }}
            navPosition="top"
            previewPosition="bottom"
            searchPosition="sticky"
            skinTonePosition="search"
          />
        </div>
      )}
    </div>
  );
}
