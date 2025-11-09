'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import data from '@emoji-mart/data';

const Picker = dynamic(() => import('@emoji-mart/react'), { ssr: false });

export default function EmojiInput({
  value,
  onChange,
  buttonClassName = 'px-2 py-1 border rounded bg-white dark:bg-gray-950',
}: {
  value?: string;
  onChange: (v: string) => void;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement | null>(null);

  // đóng khi click ra ngoài
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="relative inline-flex items-center gap-2">
      <input
        type="text"
        className="border rounded px-3 py-2 w-24 bg-white dark:bg-gray-950"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="🙂"
        maxLength={3}
      />
      <button
        type="button"
        className={buttonClassName}
        onClick={() => setOpen((v) => !v)}
        aria-label="Chọn emoji"
      >
        {value || '😊'}
      </button>

      {open && (
        <div ref={popRef} className="absolute z-50 top-11 left-0 shadow-xl">
          <div className="rounded-xl overflow-hidden border bg-white dark:bg-gray-950">
            <Picker
              data={data}
              locale="vi"
              theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
              onEmojiSelect={(e: any) => {
                onChange(e.native); 
                setOpen(false);
              }}
              navPosition="top"
              previewPosition="bottom"
              skinTonePosition="search"
              searchPosition="sticky"
            />
          </div>
        </div>
      )}
    </div>
  );
}
